// Copyright (c) 2024, Yohannes and contributors
// For license information, please see license.txt

// frappe.ui.form.on("BPPB", {
// 	refresh(frm) {

// 	},
// });
frappe.provide("erpnext.utils");

frappe.ui.form.on('BPPB', {
	refresh: function(frm) {
		if(frm.doc.docstatus == 0){
			cur_frm.add_custom_button(__('Material Request'),
            cur_frm.cscript['Make Material Request'], __('Create'));
            cur_frm.page.set_inner_btn_group_as_primary(__('Create'));
		}
		else if(frm.doc.docstatus == 1) {
			cur_frm.add_custom_button(__('Material Request Balik'),
            cur_frm.cscript['Make Material Request Balik'], __('Create'));
            cur_frm.page.set_inner_btn_group_as_primary(__('Create'));
		}

		if(cur_frm.doc.tanggal_kembali != "undefined")
		{
			frm.set_df_property('calculate_qty', 'hidden', 1);
		}
		else
		{
			frm.set_df_property('calculate_qty', 'hidden', 0);
		}

	},
	onload: function(frm) {
		if(frm.doc.docstatus == 0){
			cur_frm.add_custom_button(__('Material Request'),
            cur_frm.cscript['Make Material Request'], __('Create'));
            cur_frm.page.set_inner_btn_group_as_primary(__('Create'));
		}
		else if(frm.doc.docstatus == 1) {
			cur_frm.add_custom_button(__('Material Request Balik'),
            cur_frm.cscript['Make Material Request Balik'], __('Create'));
            cur_frm.page.set_inner_btn_group_as_primary(__('Create'));
		}
		
		//console.log(cur_frm.doc.tanggal_kembali);
		/*if(cur_frm.doc.tanggal_kembali != "undefined")
		{
			frm.set_df_property('calculate_qty', 'hidden', 1);
		}
		else
		{
			frm.set_df_property('calculate_qty', 'hidden', 0);
		}*/
	},
	before_submit: function(frm) {
		if(frm.doc.tanggal_kembali === undefined)
		{
			frappe.throw("Tanggal Kembali belum di tentukan");
			return false;
		}
		else if(cur_frm.doc.click === 0)
		{
			frappe.throw("Tarik Data Penjualan SO dulu dengan menekan tombol Get Data");
			return false;
		}
	},
	validate: function(frm) {
		get_second_uom(frm);
		
	},
	before_save: function(frm) {
		/*$.each(frm.doc.bppb_item || [], function(i, d) {
			
			if(parseInt(d.qty) <= 0)
			{
				console.log('b');
				frappe.throw(__(d.item_name + ' quantitas nya kok nol sih?'));
				return false;
			}
			else if(d.qty === undefined)
			{
				console.log('a');
				frappe.throw(__(d.item_name + ' quantitas nya kok nol sih?'));
				return false;
			}
			else
			{
				//console.log(d.qty);
				return true;
			}
		}); */
		check_qty_zero(frm);
		check_duplicate_entry(frm);
	}
});

frappe.ui.form.on('BPPB Item', {
	item_code: function (frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);
		var d =  locals[cdt][cdn];

        //console.log(row.item_code);
        if(row.item_code)
        {
            frappe.call({
			async:false,
			method:"canvassing.canvassing.doctype.bppb.bppb.get_actual_qty",
			args:{
				"item_code": row.item_code
				},
				callback: function(r){
					if(r.message)
					{
						$.each(r.message, function(j,item)
						{
							//console.log(item.warehouse + ";" + item.actual_qty);
							if(item.warehouse === "ByPass - PBJM")
							{
								frappe.model.set_value(cdt,cdn,"bypass",item.actual_qty);
								frm.refresh_field("bypass");
							}else if(item.warehouse === "Ranah - PBJM")
							{
								frappe.model.set_value(cdt,cdn,"ranah",item.actual_qty);
								frm.refresh_field("ranah");
							}else if(item.warehouse === "Mobil Kampas Canter - PBJM")
							{
								frappe.model.set_value(cdt,cdn,"canter",item.actual_qty);
								frm.refresh_field("canter");
							}else if(item.warehouse === "Mobil Kampas Grandmax - PBJM")
							{
								frappe.model.set_value(cdt,cdn,"grandmax",item.actual_qty);
								frm.refresh_field("grandmax");
							}
						});
					}
				}
			});
			/*THIS IS TO GET THE SECOND UOM IF AVAILABLE */
			var qty_bawa = row.qty;
			frappe.call({
				async:false,
				method:"canvassing.canvassing.doctype.bppb.bppb.get_second_uom",
				args:{
					"item_code": row.item_code
					},
					callback: function(r){
						if(r.message)
						{
							$.each(r.message, function(j,item)
							{
								//console.log(item.uom + ";" + item.conversion_factor + ";" + qty_bawa);
								var sec_qty = parseInt(qty_bawa) / parseInt(item.conversion_factor);
								frappe.model.set_value(cdt,cdn,"second_qty",item.uom);
								frm.refresh_field("second_qty");
								frappe.model.set_value(cdt,cdn,"second_uom",item.uom);
								frm.refresh_field("second_uom");
							});
						}
				}
			});
        }
        
    },
	
	qty: function (frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
		if(row.item_code)
        {
			var qty_bawa = row.qty;
			frappe.call({
				async:false,
				method:"canvassing.canvassing.doctype.bppb.bppb.get_second_uom",
				args:{
					"item_code": row.item_code
					},
					callback: function(r){
						if(r.message)
						{
							$.each(r.message, function(j,item)
							{
								console.log(item.uom + ";" + item.conversion_factor + ";" + qty_bawa);
								var sec_qty = parseInt(qty_bawa) / parseInt(item.conversion_factor);
								frappe.model.set_value(cdt,cdn,"second_qty",item.uom);
								frm.refresh_field("second_qty");
								frappe.model.set_value(cdt,cdn,"second_uom",item.uom);
								frm.refresh_field("second_uom");
							});
						}
				}
			});
		}
	},

	form_render: function(frm, cdt, cdn) {
		let row = frappe.get_doc(cdt, cdn);
        var d = locals[cdt][cdn];
		if(row.item_code)
        {
			frappe.call({
				//async:false,
				method: "canvassing.canvassing.doctype.bppb.bppb.get_actual_qty",
				args: {
					"item_code": row.item_code
				},
				// disable the button until the request is completed
				//btn: $('.primary-action'),
				// freeze the screen until the request is completed
				//freeze: true,
				callback: function(r) {
					// on success
					if(r.message)
					{
						var d = locals[cdt][cdn];
						var template="<table style=\"border: 1px solid black\">"+
						"<thead style=\"border: 1px solid black \">"+
						"<td width=\"10%\" valign=\"top\" style=\"border 1px solid black\">Warehouse</td>"+
						"<td width=\"10%\" valign=\"top\" style=\"border 1px solid black\">Qty</td>"+
						"</thead>"+
						"<tbody style=\"border: 1px solid black\">"+
        		    	"{% for (var item in items) { %} "+
        		    	"<tr>"+
						"<td valign=\"top\" style=\"border: 1px solid black\">"+
        		    			"<p align=\"left\">"+
        		    			"{{ items[item].warehouse }}"+
        		    			"</p>"+
        		    			"</td>"+
        		    			"<td valign=\"top\" style=\"border: 1px solid black\">"+
        		    			"<p align=\"left\">"+
        		    			"{{ items[item].actual_qty }}"+
        		    			"</p>"+
        		    			"</td>"+
						"</tr> {% } %} </tbody>"+
						"</table>";
						//$(frm.fields_dict[d.parentfield].grid.grid_rows_by_docname[cdn].grid_form.fields_dict.stock_avail.wrapper).html(frappe.render_template(template, {"items": r.message}));
						$(frm.fields_dict[d.parentfield].grid.grid_rows_by_docname[cdn].grid_form.fields_dict.stock_list.wrapper).html(frappe.render_template( template , {"items": r.message}));
						//$(frm.fields_dict[d.parentfield].grid.grid_rows_by_docname[cdn].grid_form.fields_dict.stock_list.wrapper).html("HELLO");
						//var data = frappe.render_template(template, {"items": r.message});
						//$(frm.fields_dict.stock_avail.wrapper).html("<table style=\"border: 1px solid black\"><thead style=\"border: 1px solid black \"> <td width=\"10%\" valign=\"top\" style=\"border 1px solid black\">Warehouse</td></thead> </table>");
						//frm.set_df_property('stock_list', 'option', frappe.render_template(template, {'items': r.message}));
						//$(cur_frm.fields_dict['stock_avail'].wrapper).html("<h1>Hello</h1>");
						frm.refresh_field("stock_list");
						//console.log(r.message);
						/*$.each(r.message, function(j,item)
						{
							console.log(item.warehouse);
						});*/
					}
				}
				//error: (r) => {
					// on error
				//}
			})
			/*THIS IS TO GET THE SECOND UOM IF AVAILABLE */
			var qty_bawa = row.qty;
			frappe.call({
				async:false,
				method:"canvassing.canvassing.doctype.bppb.bppb.get_second_uom",
				args:{
					"item_code": row.item_code
					},
					callback: function(r){
						if(r.message)
						{
							$.each(r.message, function(j,item)
							{
								//console.log(item.uom + ";" + item.conversion_factor + ";" + qty_bawa);
								var sec_qty = parseInt(qty_bawa) / parseInt(item.conversion_factor);
								frappe.model.set_value(cdt,cdn,"second_qty",sec_qty);
								frm.refresh_field("second_qty");
								frappe.model.set_value(cdt,cdn,"second_uom",item.uom);
								frm.refresh_field("second_uom");
							});
						}
				}
			});
		}
		//$(frm.fields_dict[d.parentfield].grid.grid_rows_by_docname[cdn].grid_form.fields_dict.stock_list.wrapper).html("HELLO");
		//frm.set_df_property('stock_list', 'option', "<h1>HELLO</h1>");
		//$(cur_frm.fields_dict.stock_list.wrapper).html("<h1>Hello</h1>");
		//wrapper = frm.fields_dict[d.parentfield].grid.grid_rows_by_docname[cdn].fields_dict.stock_list.wrapper;
		//$("<div>Loading...</div>").appendTo(wrapper);
        frm.refresh_field("stock_list");
		
		
	},
});
cur_frm.cscript['Make Material Request'] = function() {
        frappe.model.open_mapped_doc({
                //method: "erpnext.selling.doctype.quotation.quotation.make_sales_order",
                method: "canvassing.canvassing.doctype.bppb.bppb.make_material_request",
                frm: cur_frm
        })
};

cur_frm.cscript['Make Material Request Balik'] = function() {
        frappe.model.open_mapped_doc({
                //method: "erpnext.selling.doctype.quotation.quotation.make_sales_order",
                method: "canvassing.canvassing.doctype.bppb.bppb.make_material_request_balik",
                frm: cur_frm
        })
};

frappe.ui.form.on("BPPB", "tanggal_kembali", function(frm) {
	
	//console.log(cur_frm.doc.tanggal_berangkat);
	if(cur_frm.doc.tanggal_kembali != "undefined")
	{
		frm.set_df_property('calculate_qty', 'hidden', 0);
	}
});

frappe.ui.form.on("BPPB", "refresh_stock", function(frm) {
	let data_length = frm.doc.bppb_item.length;
	//console.log(data_length);
	$.each(frm.doc.bppb_item || [], function(i, d) {
		setTimeout(() => {
			frappe.call({
				async:false,
				method:"canvassing.canvassing.doctype.bppb.bppb.get_actual_qty",
				args:{
					"item_code": d.item_code
				},
				callback: function(r){
					if(r.message)
					{
						$.each(r.message, function(j,item)
						{
							//console.log(item.warehouse + ";" + item.actual_qty);
							if(item.warehouse === "ByPass - PBJM")
							{
								cur_frm.doc.bppb_item[i].bypass = item.actual_qty;
								//frappe.model.set_value(cdt,cdn,"bypass",item.actual_qty);
								//frm.refresh_field("bypass");
							}else if(item.warehouse === "Ranah - PBJM")
							{
								cur_frm.doc.bppb_item[i].ranah = item.actual_qty;
								//frappe.model.set_value(cdt,cdn,"ranah",item.actual_qty);
								//frm.refresh_field("ranah");
							}else if(item.warehouse === "Mobil Kampas Canter - PBJM")
							{
								cur_frm.doc.bppb_item[i].canter = item.actual_qty;
								//frappe.model.set_value(cdt,cdn,"canter",item.actual_qty);
								//frm.refresh_field("canter");
							}else if(item.warehouse === "Mobil Kampas Grandmax - PBJM")
							{
								cur_frm.doc.bppb_item[i].grandmax = item.actual_qty;
								//frappe.model.set_value(cdt,cdn,"grandmax",item.actual_qty);
								//frm.refresh_field("grandmax");
							}
						});
						frm.refresh_field("bppb_item");
					}
				}
			});
			if(data_length >=10)
			{
				let progress = i + 1;
				frappe.show_progress(
					__("Processing"),
					progress,
					data_length,
					null,
					true
				);
			}
		}, 0);
	});
});

frappe.ui.form.on("BPPB", "calculate_qty", function(frm) {
	let qty_jual =0;
	let qty_sisa = 0;
	let data_length = frm.doc.bppb_item.length;
	//console.log(data_length);
	$.each(frm.doc.bppb_item || [], function(i, d) {
		frappe.call({
		async:false,
		method: "canvassing.canvassing.doctype.bppb.bppb.get_items_qty",
		args: {
			"warehouse": cur_frm.doc.mobil,
			"item_code": d.item_code,
			"start_date": cur_frm.doc.tanggal_berangkat,
			"end_date": cur_frm.doc.tanggal_kembali,
			"salesman": cur_frm.doc.nama_sales
		},		
		callback: function(r) {
			// on success
			if(r.message)
			{
				setTimeout(() => {
					if(r.message.length === 0)
					{
						//console.log(r.message);
						cur_frm.doc.bppb_item[i].quantity_terjual = 0;
						cur_frm.doc.bppb_item[i].quantity_sisa = parseInt(cur_frm.doc.bppb_item[i].qty) - 0;
						frm.refresh_field("bppb_item");
					}
					else
					{
						$.each(r.message, function(j,item)
						{
							//console.log(item.order_qty + "," + item.item_code);
							//console.log(cur_frm.doc.bppb_item[i].qty);
							cur_frm.doc.bppb_item[i].quantity_terjual = item.order_qty;
							cur_frm.doc.bppb_item[i].quantity_sisa = parseInt(cur_frm.doc.bppb_item[i].qty) - parseInt(item.order_qty);
							frm.refresh_field("bppb_item");
							frm.set_value('click',1);
						});	
					}
					if(data_length >=10)
					{
						let progress = i + 1;
						frappe.show_progress(
							__("Processing"),
							progress,
							data_length,
							null,
							true
						);
					}
				}, 0);
				//frm.refresh_field("bppb_item");
			}
		},
		error: (r) => {
        // on error
		}
		});
		
	});
	frm.set_df_property('calculate_qty', 'hidden', 1);
});

function get_second_uom(frm)
{
	var qty_bawa;
	$.each(frm.doc.bppb_item || [], function(i, d) {
		qty_bawa = d.qty;
		frappe.call({
				async:false,
				method:"canvassing.canvassing.doctype.bppb.bppb.get_second_uom",
				args:{
					"item_code": d.item_code
					},
					callback: function(r){
						if(r.message)
						{
							$.each(r.message, function(j,item)
							{
								//console.log(item.uom + ";" + item.conversion_factor + ";" + qty_bawa);
								var sec_qty = parseInt(qty_bawa) / parseInt(item.conversion_factor);
								cur_frm.doc.bppb_item[i].second_qty = sec_qty
								cur_frm.doc.bppb_item[i].second_uom = item.uom;
								
								frm.refresh_field("bppb_item");
							});
						}
				}
		});
	});
}

function check_qty_zero(frm)
{
	$.each(frm.doc.bppb_item || [], function(i, d) {
			
			if(parseInt(d.qty) <= 0)
			{
				//console.log('b');
				frappe.throw(__(d.item_name + ' quantitas nya kok nol sih?'));
				return false;
			}
			else if(d.qty === undefined)
			{
				//console.log('a');
				frappe.throw(__(d.item_name + ' quantitas nya kok nol sih?'));
				return false;
			}
			else
			{
				//console.log(d.qty);
				return true;
			}
		});
}

function check_duplicate_entry(frm)
{
	$.each(frm.doc.bppb_item || [], function(i, d) {
		console.log(i);
		$.each(frm.doc.bppb_item || [], function(j, e) {
			console.log(i);
			if(i != j)
			{
				if(cur_frm.doc.bppb_item[i].item_code === cur_frm.doc.bppb_item[j].item_code)
				{
					var frst = i + 1, scd = j + 1;
					frappe.throw(__('Row ' + frst + ' duplicate on row ' + scd));
					return false;
				}
				else
				{
					//console.log(d.qty);
					return true;
				}
			}
		});
	});
}