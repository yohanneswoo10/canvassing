// Copyright (c) 2024, Yohannes and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Tire Claim", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Tire Claim', {
	refresh: function(frm, cdt, cdn) {
		if(frm.doc.docstatus === 1) {
			if(frm.doc.status !== 'Closed') {
				frm.add_custom_button(__('Closed'), function(){
					frappe.call({
						method: "erpnext.warranty.doctype.tire_claim.tire_claim.update_status",
						args: {name: frm.doc.name, status: 'Closed'},
						callback: function(r){
							me.frm.reload_doc();
						},
						always: function() {
							frappe.ui.form.is_saving = false;
						}
					});
				}, __("Status"))
			}
			if(frm.doc.status !== 'Open') {
				frm.add_custom_button(__('Open'), function() {
					frappe.call({
						method: "erpnext.warranty.doctype.tire_claim.tire_claim.update_status",
						args: {name: frm.doc.name, status: 'Open'},
						callback: function(r){
							me.frm.reload_doc();
						},
						always: function() {
							frappe.ui.form.is_saving = false;
						}
					});
				}, __("Status"))
			}
			//var d = frappe.get_doc(cdt, cdn);
			/*if (current_internal_status != is){
				switch(is) {
					case "Received":
						if (row.date_sent_to_supplier == "") {
							update_stock(frm);
						}
						else {
							frappe.msgprint(__('Barang yang sudah di kirim ke supplier tidak bisa balik diterima dari outlet'));
						}
						
						break;
					case "Sent To Supplier":
						update_stock(frm);
						break;
					case "Result From Supplier":
						update_stock(frm);
						break;
					case "Sudah Diganti":
						update_stock(frm);
						break;
					default:
						break;
				}
			}*/
		}
	},
	/*on_submit: function(frm) {
		update_stock(frm);
	},
	before_cancel: function(frm) {
		frappe.call({
			method: "erpnext.warranty.doctype.tire_claim.tire_claim.cancel_doc",
			args: {name: frm.doc.name},
			callback: function(r){
				console.log(r);
			}
		});
	},*/
	onload: function(frm) {
		
	},
	validate: function(frm) {
		//update_stock(frm);
	},
});

function update_stock(frm)
{
	frappe.call({
		method: "erpnext.warranty.doctype.tire_claim.tire_claim.update_stock",
		args: {name: frm.doc.name},
			callback: function(r){
			console.log(r);
		}
	});
}