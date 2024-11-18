// Copyright (c) 2024, Yohannes and contributors
// For license information, please see license.txt

// frappe.ui.form.on("LPPU", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("LPPU", "get_data", function(frm) {
	
	let dis =0;
	let total_harga =0;
	let total_qty = 0;
	let diskon=0;
	let grand_total_tunai = 0;
	let grand_total_credit = 0;
	let total_harga_price_list =0;
	let total_diskon_tambahan = 0;
	let customer = "";
	let salesman = cur_frm.doc.salesman;
	let sales_person = "";
	let t = false;
	
	if(cur_frm.doc.salesman == undefined || cur_frm.doc.mobil == undefined || cur_frm.doc.tanggal_berangkat == undefined || cur_frm.doc.tanggal_kembali == undefined)
	{
		console.log(cur_frm.doc.salesman);
		frappe.msgprint({
			title: __('Notification'),
			indicator: 'green',
			message: __('Silahkan masukkan nama sales, mobil, tanggal jalan dan tanggal kembali dengan benar')
		});
	}
	else
	{
		let data_length = 0;
		let progress = 0;
		
		frappe.db.get_list('Sales Order', {
			fields: ['name', 'customer', 'customer_name', 'grand_total', 'discount_amount', 'total_qty', 'payment_terms_template'],
			filters: {
				transaction_date: ["between",[cur_frm.doc.tanggal_berangkat, cur_frm.doc.tanggal_kembali]],
				status: ["!=", "Cancelled"],
				set_warehouse: cur_frm.doc.mobil
			},
			order_by: 'payment_terms_template',
			limit: 500,
		}).then(records => {
			data_length = records.length;
			$.each(records, function(i,d)
			{
				setTimeout(() => {
					var childTable1 = cur_frm.add_child("lppu_detail");
					childTable1.so_number = d.name;
					childTable1.customer = d.customer;
					childTable1.customer_name = d.customer_name;
					childTable1.grand_total = d.grand_total;
					childTable1.payment_term = d.payment_terms_template;
					frm.refresh_fields("lppu_detail");
					let progress = i + 1;
					frappe.show_progress(
						__("Processing"),
						progress,
						data_length,
						null,
						true
					);
				}, 0);	
			});
		});
		
			frappe.call({
				async:false,
				method:"erpnext.sales_team.doctype.form_lppu.form_lppu.get_item_data",
				args:{
					"warehouse": cur_frm.doc.mobil,
					"from_invoice": cur_frm.doc.tanggal_berangkat,
					"to_invoice": cur_frm.doc.tanggal_kembali,
					"sales_person": cur_frm.doc.salesman
				},
				callback: function(r){
					if(r.message)
					{
						//console.log(r.message);
						for(let i of r.message)
						{
							//console.log(i[0]);
							var childTable = cur_frm.add_child("lppu_item");
							childTable.customer = i[0];
							childTable.item_code = i[1];
							childTable.item_name = i[2];
							childTable.quantity = i[3];
							childTable.price_list = i[4];
							childTable.discount_percentage = i[5];
							diskon = diskon + (i[3] * i[6]);
							total_harga_price_list = total_harga_price_list + (i[3] * i[4]);
							childTable.discount_amount = i[6];
							childTable.total = i[7];
							childTable.payment_terms = i[8];
							frm.refresh_fields("lppu_item");
						}
						//console.log(dis);
						frm.set_value('total_diskon_barang', diskon);
						frm.set_value('total_harga_price_list', total_harga_price_list);
					}
				}
			});
			
			frappe.call({
				async:false,
				method:"erpnext.sales_team.doctype.form_lppu.form_lppu.get_sales_order",
				args:{
					"warehouse": cur_frm.doc.mobil,
					"from_order": cur_frm.doc.tanggal_berangkat,
					"to_order": cur_frm.doc.tanggal_kembali
				},
				callback: function(r){
					if(r.message)
					{
						$.each(r.message, function(k,p)
						{
							if(p.payment_terms_template === "Cash")
							{
								grand_total_tunai = grand_total_tunai + p.grand_total;
							}
							else
							{
								grand_total_credit = grand_total_credit + p.grand_total;
							}
							total_harga = total_harga + p.grand_total;
							total_qty = total_qty + p.total_qty;
							dis = dis + p.discount_amount;
							let total_diskon = dis + cur_frm.doc.total_diskon_barang;
							frm.set_value('total_harga',total_harga);
							frm.set_value('total_qty', total_qty);
							frm.set_value('total_diskon_tambahan', dis);
							frm.set_value('total_penjualan_cash', grand_total_tunai);
							frm.set_value('total_penjualan_credit', grand_total_credit);
							frm.set_value('total_diskon', total_diskon);
						});
					}
				}
			});
			
			
	}
	
	
	
	//console.log(cur_frm.doc.mobil);
	
	/*
	if(cur_frm.doc.salesman == undefined || cur_frm.doc.mobil == undefined || cur_frm.doc.tanggal_berangkat == undefined || cur_frm.doc.tanggal_kembali == undefined)
	{
		console.log(cur_frm.doc.salesman);
		frappe.msgprint({
			title: __('Notification'),
			indicator: 'green',
			message: __('Silahkan masukkan nama sales, mobil, tanggal jalan dan tanggal kembali dengan benar')
		});
	}
	else
	{
		frappe.db.get_list('Sales Order', {
			fields: ['name', 'customer_name', 'grand_total', 'discount_amount', 'total_qty', 'payment_terms_template'],
			filters: {
				status: 'Draft',
				transaction_date: ["between",[cur_frm.doc.tanggal_berangkat, cur_frm.doc.tanggal_kembali]],
				set_warehouse: cur_frm.doc.mobil
			},
			limit: 500,
		}).then(records => {
			//console.log(records);
			
			$.each(records, function(i,d)
			{
				frappe.call({
				async:false,
				method:'frappe.client.get_value',
				args:{
					parent: 'Sales Order',
					doctype: 'Sales Team',
					fieldname: ['parent','sales_person'], 
					filters: {'parent': d.name}
					},
					callback: function(r){
						if(r.message)
						{
							console.log(r.message.sales_person);
							sales_person = r.message.sales_person;
						}
					}
				});
				
				if(sales_person === salesman)
				{
					console.log("True");
					t = true;
					if(d.payment_terms_template === "Cash")
					{
						grand_total_tunai = grand_total_tunai + d.grand_total;
					}else
					{
						grand_total_credit = grand_total_credit + d.grand_total;
					}
					//console.log(d.items);
					//cur_frm.set_value('total_harga', d.grand_total);
					//cur_frm.set_value('total_qty', d.total_qty);
					
					total_harga = total_harga + d.grand_total;
					total_qty = total_qty + d.total_qty;
					dis = dis + d.discount_amount;
					customer = d.customer_name;
					//console.log(total_harga);
					//console.log(dis);
				
					frappe.call({
					async:false,
					method:'frappe.client.get_list',
					args:{
						parent: 'Sales Order',
						doctype: 'Sales Order Item',
						fields: ['parent','item_code', 'item_name', 'qty', 'price_list_rate','discount_percentage','discount_amount','rate','amount'], 
						filters: {'parent': d.name},
						limit: 500,
						},
						callback: function(r){
							if(r.message)
							{
								//console.log(r.message);
								
								$.each(r.message, function(j,row)
								{
									var childTable = cur_frm.add_child("lppu_item");
									childTable.customer = customer;
									childTable.item_code = row.item_code;
									childTable.item_name = row.item_name;
									childTable.quantity = row.qty;
									childTable.price_list = row.price_list_rate;
									childTable.discount_percentage = row.discount_percentage;
									diskon = diskon + (row.qty * row.discount_amount);
									total_harga_price_list = total_harga_price_list + (row.qty * row.price_list_rate);
									childTable.discount_amount = row.discount_amount;
									childTable.total = row.amount;
									//childTable.total = d.payment_terms_template;
								});
								frm.refresh_fields("lppu_item");
								//console.log(diskon);
								//frm.set_value('customer', customer);
								frm.set_value('total_diskon', dis + diskon);
								frm.set_value('total_diskon_barang', diskon);
								frm.set_value('total_harga_price_list', total_harga_price_list);
								frm.refresh_fields("total_diskon");
								
							}
						}
					});
					//console.log(diskon);
					frm.set_value('total_harga',total_harga);
					frm.set_value('total_qty', total_qty);
					frm.set_value('total_diskon_tambahan', dis);
					frm.set_value('total_penjualan_cash', grand_total_tunai);
					frm.set_value('total_penjualan_credit', grand_total_credit);
				}
				else
				{
					//t = false;
					console.log("FALSE");
				}
			});//Loop
			if(t == false)
			{
				frappe.msgprint({
					title: __('Notification'),
					indicator: 'green',
					message: __('Silahkan Cek nama sales, mobil, tanggal jalan dan tanggal kembali dengan benar karena data tidak di temukan')
				});
			}
			else
			{
				frm.set_df_property('get_data', 'hidden', 1);
			}
		});//db_get_list
	}
	//frm.set_df_property('get_data', 'hidden', 1);
	//console.log(dis + diskon);
	//cur_frm.set_value('total_diskon', dis + diskon);*/
});