# Copyright (c) 2024, Yohannes and contributors
# For license information, please see license.txt

# import frappe
import frappe
import frappe.utils
from frappe import _
from frappe.model.mapper import get_mapped_doc
from erpnext.setup.doctype.item_group.item_group import get_item_group_defaults
from erpnext.stock.doctype.item.item import get_item_defaults
from frappe.contacts.doctype.address.address import get_company_address
from frappe.model.utils import get_fetch_values
from frappe.utils import add_days, cint, cstr, flt, get_link_to_form, getdate, nowdate, strip_html
from six import string_types
from frappe.model.document import Document

class LPPU(Document):
	pass

@frappe.whitelist()
def get_item_data(warehouse, from_invoice, to_invoice, sales_person):
	items = []
	details = []
	total_harga =0
	grand_total_credit = 0
	grand_total_tunai = 0
	sales_order = get_sales_order(warehouse, from_invoice, to_invoice)
	for so in sales_order:
		salesman = get_sales_person(so.name)
		total_harga = total_harga + so.grand_total
		if salesman == sales_person:
			if so.payment_terms_template == 'Cash':
				grand_total_tunai = grand_total_tunai + so.grand_total
			else:
				grand_total_credit = grand_total_credit + so.grand_total
			
			sales_order_item = get_sales_order_item(so.name)
			for soi in sales_order_item:
				details=[so.customer_name,soi.item_code,soi.item_name,soi.qty,soi.price_list_rate,soi.discount_percentage,soi.discount_amount,soi.amount,so.payment_terms_template,total_harga,grand_total_credit, grand_total_tunai, so.total_qty,so.discount_amount]
				items.append(details)
	return items

@frappe.whitelist()
def get_sales_order(warehouse, from_order, to_order):
	invoices = frappe.db.get_list('Sales Order',
			fields= ['name', 'transaction_date', 'customer_name', 'grand_total', 'discount_amount', 'total_qty', 'payment_terms_template'],
			filters= {
				'transaction_date': ["between",[from_order, to_order]],
                'status': ["!=","Cancelled"],
				'set_warehouse': warehouse
			},
			order_by = 'transaction_date',
			limit= 500)
	return invoices

def get_sales_person(invoice):
	sales_person = frappe.db.get_value('Sales Team', {'parent': invoice}, 'sales_person')
	return sales_person

def get_sales_order_item(invoice):
	items = frappe.db.get_list('Sales Order Item',
			fields= ['parent','item_code', 'item_name', 'qty', 'price_list_rate','discount_percentage','discount_amount','rate','amount'], 
			filters= {'parent': invoice},
			order_by= 'item_code',
			limit= 500)
	return items