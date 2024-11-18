// Copyright (c) 2024, Yohannes and contributors
// For license information, please see license.txt

// frappe.ui.form.on("DTFT", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('DTFT', {
	onload(frm) {
		cur_frm.fields_dict.dtft_detail.grid.get_field("invoice_no").get_query = function(doc, cdt, cdn) {
			return {
				filters: [
					["outstanding_amount", '>', 0]
				]
			};
		};
	},
	before_save(frm) {
	    let jlm_faktur =0;
	    let outstanding = 0;
	    let item = cur_frm.doc.dtft_detail;
	    for(let i of item)
		{
		    jlm_faktur = jlm_faktur + i.jumlah_faktur;
		    outstanding = outstanding + i.sisa_pembayaran;
		}
		frm.set_value('total_nilai_faktur', jlm_faktur);
		frm.set_value('total_outstanding_faktur', outstanding);
		frm.set_value('total_faktur', item.length);
	}
});

frappe.ui.form.on('DTFT Detail', {
	setup: function(frm,cdt,cdn) {
	    let item = frappe.get_doc(cdt, cdn);
		cur_frm.fields_dict.dtft_detail.grid.get_field("invoice_no").get_query = function(doc, cdt, cdn) {
			return {
				filters: [
					["outstanding_amount", '>', 0]
				]
			};
		};
	}
});