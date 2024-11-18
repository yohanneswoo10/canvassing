# Copyright (c) 2024, Yohannes and contributors
# For license information, please see license.txt

# import frappe
import frappe
import frappe.utils
from frappe import _, msgprint, throw
from frappe.utils import cstr, flt, nowdate, nowtime
from frappe.model.document import Document

class TireClaim(Document):
    def before_update_after_submit(self):
        banindo = "Banindo Claim Warehouse"
        supplier = "Supplier Claim Warehouse"
        result = "Result Claim Warehouse"
        accepted = "Accepted Claim Warehouse"
        rejected = "Rejected Claim Warehouse"
        support = "Support Claim Warehouse"
        for d in self.get_prev_data():
            #frappe.msgprint(("ItemCode {0}: internal status {1} serial number {2}").format(frappe.bold(d.item_code), frappe.bold(d.internal_status), frappe.bold(d.item_serial)))
            for j in self.get_current_item():
                if d.item_code == j.item_code:
                    if d.item_serial == j.item_serial or d.item_dot == j.item_dot:
                        qty_claim_warehouse = get_actual_qty_by_warehouse(j.item_code,j.item_serial, j.item_dot, banindo)
                        qty_supplier_claim_warehouse = get_actual_qty_by_warehouse(j.item_code,j.item_serial, j.item_dot, supplier)
                        qty_accepted_claim_warehouse = get_actual_qty_by_warehouse(j.item_code,j.item_serial, j.item_dot, accepted)
                        qty_rejected_claim_warehouse = get_actual_qty_by_warehouse(j.item_code,j.item_serial, j.item_dot, rejected)
                        qty_support_claim_warehouse = get_actual_qty_by_warehouse(j.item_code,j.item_serial, j.item_dot, support)
                        if d.internal_status != j.internal_status:
                            if j.internal_status == "Received":
                                frappe.throw(
                                    title='Error',
                                    msg='Anda tidak bisa mengembalikan ke user'
                                    )
                            if j.internal_status == "Sent To Supplier":
                                if d.internal_status != "Result From Supplier":
                                    balance_qty(j.item_code, j.item_serial, j.item_dot, supplier, j.qty)        
                            if j.internal_status == "Result From Supplier":
                                if j.result == "Accepted":
                                    if j.customer_status == "Belum Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, result, j.qty)
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, accepted, j.qty)
                                if j.result == "Rejected":
                                    if j.customer_status == "Belum Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, result, j.qty)
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, rejected, j.qty)
                                if j.result == "Support":
                                    if j.customer_status == "Belum Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, result, j.qty)
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, support, j.qty)
                        elif j.internal_status == "Result From Supplier":
                            #frappe.msgprint("A")
                            if d.result != j.result:
                                #frappe.msgprint("A")
                                if j.result == "Accepted":
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, accepted, j.qty)
                                if j.result == "Rejected":
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, rejected, j.qty)
                                if j.result == "Support":
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, support, j.qty)
                            elif d.customer_status != j.customer_status:
                                if j.result == "Accepted":
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, accepted, j.qty)
                                    if j.customer_status == "Belum Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, result, j.qty)
                                if j.result == "Rejected":
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, rejected, j.qty)
                                    if j.customer_status == "Belum Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, result, j.qty)
                                if j.result == "Support":
                                    if j.customer_status == "Sudah Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, support, j.qty)
                                    if j.customer_status == "Belum Diganti":
                                        balance_qty(j.item_code, j.item_serial, j.item_dot, result, j.qty)

        #for d in self.get_current_item():
            #frappe.msgprint(("ItemCode #{0}: internal status {1} serial number {2}").format(frappe.bold(d.item_code), frappe.bold(d.internal_status), frappe.bold(d.item_serial)))
    def validate(self):
        #check no seri ban
        mismatch = False
        for j in self.item:
            if j.no_seri_ban == "SN:" and j.no_dot_ban == "DOT":
                frappe.throw(_("Row #{0}: Item Code {1} No Seri atau No DOT Kosong").format(frappe.bold(j.idx), frappe.bold(j.item)))

    def on_submit(self):
        for j in self.get_current_item():
            if j.internal_status == "Received":
                qty_dict = {}
                qty_dict["actual_qty"] = flt(j.qty)
                update_bin_qty(j.item_code,j.item_serial, j.item_dot, "Banindo Claim Warehouse", qty_dict)
            else:
                frappe.throw(
                    title='Error',
                    msg='Set Internal status ke Received dahulu'
                    )
    
    def on_cancel(self):
        for d in self.get_prev_data():
            delete_bin(d.item_code, d.item_serial, d.item_dot)
    
    def get_current_item(self):
        il = []
        for d in self.item:
            il.append(frappe._dict({
                'item_code': d.item,
                'item_serial': d.no_seri_ban,
                'item_dot': d.no_dot_ban,
                'qty': d.quantity,
                'uom': d.uom,
                'internal_status': d.internal_status,
                'result': d.result,
                'customer_status': d.customer_status
        }))
        return il
    
    def get_prev_data(self):
        il = []
        for d in frappe.db.sql("SELECT p.warehouse, c.item, c.no_seri_ban, c.no_dot_ban, c.quantity, c.uom , c.internal_status, c.result, c.customer_status FROM `tabTire Claim` as p inner join `tabClaim Form Item` as c on p.name = c.parent WHERE p.name =%s", (self.name), as_dict=True):
            il.append(frappe._dict({
                'warehouse': d.warehouse,
                'item_code': d.item,
                'item_serial': d.no_seri_ban,
                'item_dot': d.no_dot_ban,
                'qty': d.quantity,
                'uom': d.uom,
                'internal_status': d.internal_status,
                'result': d.result,
                'customer_status': d.customer_status
            }))
        return il
        
    
    def del_bin(item_code, item_serial, item_dot):
        frappe.db.delete("Bin Claim", {"item_code": item_code, "item_serial": item_serial, "item_dot": item_dot})

@frappe.whitelist()
def update_status(name,status):
    frappe.db.set_value('Tire Claim', name, 'status', status)
    
def update_stock_ledger():
    pass

@frappe.whitelist()       
def get_item_list(name):
    il = []
    for d in frappe.db.sql("SELECT p.warehouse, c.item, c.no_seri_ban, c.no_dot_ban, c.quantity, c.uom , c.internal_status, c.result, c.customer_status FROM `tabTire Claim` as p inner join `tabClaim Form Item` as c on p.name = c.parent WHERE p.name =%s", (name), as_dict=True):
        il.append(frappe._dict({
            'warehouse': d.warehouse,
            'item_code': d.item,
            'item_serial': d.no_seri_ban,
            'item_dot': d.no_dot_ban,
            'qty': d.quantity,
            'uom': d.uom,
            'internal_status': d.internal_status,
            'result': d.result,
            'customer_status': d.customer_status
        }))
    return il

def get_actual_qty_by_warehouse(item_code,item_serial,item_dot,warehouse):
    qty = frappe.db.get_value("Bin Claim", {"item_code": item_code, "item_serial": item_serial, "item_dot": item_dot, "warehouse": warehouse}, ['actual_qty'])
    return qty

def update_bin_qty(item_code, item_serial, item_dot, warehouse, qty_dict=None):
    bin = get_bin(item_code, item_serial, item_dot, warehouse)
    mismatch = False
    for field, value in qty_dict.items():
        if flt(bin.get(field)) != flt(value):
            bin.set(field, flt(value))
            mismatch = True

    if mismatch:
        bin.db_update()
        bin.clear_cache()
    return bin

def balance_qty(item_code, item_serial, item_dot, target_ware, qty):
    ware = frappe.db.get_value("Bin Claim", {"item_code": item_code, "item_serial": item_serial, "item_dot": item_dot, "actual_qty": ['>', 0] }, ["warehouse"])
    target_ware_q = get_actual_qty_by_warehouse(item_code,item_serial, item_dot, target_ware)
    ori_ware_q = get_actual_qty_by_warehouse(item_code,item_serial, item_dot, ware)
    qty_dict = {}
    qty_dict["actual_qty"] = flt(ori_ware_q) - flt(qty)
    update_bin_qty(item_code,item_serial, item_dot, ware, qty_dict)
    qty_dict = {}
    qty_dict["actual_qty"] = flt(qty) + flt(target_ware_q)
    update_bin_qty(item_code,item_serial, item_dot, target_ware, qty_dict)
    
@frappe.whitelist()        
def update_stock(name):
    li = []
    for d in get_item_list(name):
        
        qty_dict = {}
        qty_claim_warehouse = get_actual_qty_by_warehouse(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM")
        qty_supplier_claim_warehouse = get_actual_qty_by_warehouse(d.item_code,d.item_serial, d.item_dot, "Supplier Claim Warehouse - PBJM")
        qty_accepted_claim_warehouse = get_actual_qty_by_warehouse(d.item_code,d.item_serial, d.item_dot, "Accepted Claim Warehouse - PBJM")
        qty_rejected_claim_warehouse = get_actual_qty_by_warehouse(d.item_code,d.item_serial, d.item_dot, "Rejected Claim Warehouse - PBJM")
        qty_support_claim_warehouse = get_actual_qty_by_warehouse(d.item_code,d.item_serial, d.item_dot, "Support Claim Warehouse - PBJM")
        
        li.append(frappe._dict({ 
            'qty': d.qty,
            'qty_claim_w': qty_claim_warehouse
            }))
            
            
        if d.internal_status == "Received":
            qty_dict = {}
            qty_dict["actual_qty"] = flt(d.qty)
            update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
        if d.internal_status == "Sent To Supplier":
            qty_dict = {}
            qty_dict["actual_qty"] = flt(qty_claim_warehouse) - flt(d.qty)
            update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
            qty_dict = {}
            qty_dict["actual_qty"] = flt(d.qty) + flt(qty_supplier_claim_warehouse)
            update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Supplier Claim Warehouse - PBJM", qty_dict)
        if d.internal_status == "Result From Supplier":
            if d.status == "Accepted":
                if d.customer_status == "Belum Diganti":
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(d.qty) + flt(qty_claim_warehouse)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(qty_supplier_claim_warehouse) - flt(d.qty)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Supplier Claim Warehouse - PBJM", qty_dict)
                if d.customer_status == "Sudah Diganti":
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(qty_claim_warehouse) - flt(d.qty)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(d.qty) + flt(qty_accepted_claim_warehouse)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Accepted Claim Warehouse - PBJM", qty_dict)
            if d.status == "Rejected":
                if d.customer_status == "Belum Diganti":
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(d.qty) + flt(qty_claim_warehouse)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(qty_supplier_claim_warehouse) - flt(d.qty)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Supplier Claim Warehouse - PBJM", qty_dict)
                if d.customer_status == "Sudah Diganti":
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(qty_claim_warehouse) - flt(d.qty)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(d.qty) + flt(qty_rejected_claim_warehouse)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Rejected Claim Warehouse - PBJM", qty_dict)
            if d.status == "Support":
                if d.customer_status == "Belum Diganti":
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(d.qty) + flt(qty_claim_warehouse)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(qty_supplier_claim_warehouse) - flt(d.qty)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Supplier Claim Warehouse - PBJM", qty_dict)
                if d.customer_status == "Sudah Diganti":
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(qty_claim_warehouse) - flt(d.qty)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Claim Warehouse - PBJM", qty_dict)
                    qty_dict = {}
                    qty_dict["actual_qty"] = flt(d.qty) + flt(qty_support_claim_warehouse)
                    update_bin_qty(d.item_code,d.item_serial, d.item_dot, "Support Claim Warehouse - PBJM", qty_dict)
    return li
    
def get_bin(item_code, item_serial, item_dot, warehouse):
    bin = frappe.db.get_value("Bin Claim", {"item_code": item_code, "item_serial": item_serial, "item_dot": item_dot, "warehouse": warehouse})
    if not bin:
        bin_obj = frappe.get_doc({
            "doctype": "Bin Claim",
            "item_code": item_code,
            "item_serial": item_serial,
            "item_dot": item_dot,
            "warehouse": warehouse,
        })
        bin_obj.flags.ignore_permissions = 1
        bin_obj.insert()
    else:
        bin_obj = frappe.get_doc('Bin Claim', bin, for_update=True)
    bin_obj.flags.ignore_permissions = True
    return bin_obj
    
def check_bin (item_code, item_serial, item_dot, warehouse):
    bin = frappe.db.get_value("Bin Claim", {"item_code": item_code, "item_serial": item_serial, "item_dot": item_dot, "warehouse": warehouse})

@frappe.whitelist()    
def cancel_doc(name):
    for d in get_item_list(name):
        delete_bin(d.item_code, d.item_serial, d.item_dot)
        
def delete_bin(item_code, item_serial, item_dot):
    frappe.db.delete("Bin Claim", {"item_code": item_code, "item_serial": item_serial, "item_dot": item_dot})