import { computed, observable, runInAction } from 'mobx'

import {
	DEFAULT_LANGUAGE,
	DEFAULT_CURRENCY,
	DEFAULT_DUE_PERIOD,
	DEFAULT_VAT_STYLE,
	// VAT_AMOUNT,
} from 'consts'

import isoCurrencies from 'currency/helpers/list'
import PaymentTypeStore from 'payment-type/stores/PaymentTypeStore'

export default class InvoiceModel {
	id
	logo
	@observable language
	@observable issue_date
	@observable tax_date
	@observable due_date
	@observable order_number
	@observable order_number_autocalc
	@observable to_other_eu_country
	@computed get price() {
		return this.invoice_rows.reduce((price, row) => {
			price += parseFloat(row[1], 10)
			return price
		}, 0)
	}
	@computed get vat_amount() {
		return this.invoice_rows.reduce((vat, row) => {
			vat += row[1] * ((row.length > 2 ? row[2] : 0) / 100)
			return vat
		}, 0)
	}
	@computed get total_price() {
		return this.price + ((this.is_tax_document || this.to_other_eu_country) ? this.vat_amount : 0)
	}
	@observable currency
	// @observable discount
	@observable is_tax_document
	@observable supplier // the text on invoice
	@observable supplier_id // the id (so that I don't save the whole object in db)
	@observable supplier_ref // the enriched supplier object
	@observable purchaser
	@observable purchaser_id
	@observable purchaser_ref
	@observable bank_account_id // if true, I don't check any other bank_account fields and I prefill them from the supplier
	@observable bank_account // {}
	// @observable bank_account_number
	// @observable bank_account_bank
	// @observable bank_account_swift
	// @observable bank_account_iban
	@observable payment_type
	@observable qr_code
	@observable footer
	@observable vat_style
	@computed get qr_code_value() {
		const due_date = new Date(this.due_date)
		if (!(
			this.bank_account && this.bank_account.iban && this.bank_account.swift
			&& this.total_price > 0
			&& this.currency && isoCurrencies.indexOf(this.currency) > -1
			&& due_date && typeof due_date.getDate === 'function'
			&& this.order_number
		)) return ''
		const spayd = 'SPD*1.0'
			+ '*ACC:' + this.bank_account.iban + '+' + this.bank_account.swift
			+ '*AM:' + String(this.total_price.toFixed(2))
			+ '*CC:' + String(this.currency).toUpperCase()
			+ '*DT:' + due_date.toISOString().slice(0, 10).replace(/-/g, '')
			+ '*X-VS:' + String(this.order_number.slice(0, 10))
		return spayd
	}
	@observable invoice_rows
	@observable autocalc

	constructor({
		id,
		logo,
		language,
		issue_date,
		tax_date,
		due_date,
		order_number,
		order_number_autocalc,
		to_other_eu_country,
		// price,
		currency,
		is_tax_document,
		supplier,
		supplier_id,
		supplier_ref,
		purchaser,
		purchaser_id,
		purchaser_ref,
		bank_account,
		payment_type,
		qr_code,
		vat_style,
		invoice_rows,
		footer,
	} = {}) {
		runInAction(() => {
			this.id = id
			this.logo = logo
			this.language = language || DEFAULT_LANGUAGE
			this.issue_date = issue_date || (new Date()).toISOString().slice(0, 10)
			this.tax_date = tax_date || (new Date()).toISOString().slice(0, 10)
			this.due_date = due_date || (new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * DEFAULT_DUE_PERIOD))).toISOString().slice(0, 10)
			this.order_number = order_number
			this.order_number_autocalc = order_number_autocalc !== void 0 ? order_number_autocalc : true
			this.to_other_eu_country = to_other_eu_country || false
			this.currency = currency || DEFAULT_CURRENCY
			this.is_tax_document = is_tax_document
			this.supplier = supplier
			this.supplier_id = supplier_id
			this.supplier_ref = supplier_ref
			this.purchaser = purchaser
			this.purchaser_id = purchaser_id
			this.purchaser_ref = purchaser_ref
			this.bank_account = bank_account
			this.payment_type = payment_type || PaymentTypeStore.paymentTypes[0]
			this.qr_code = qr_code !== void 0 ? qr_code : true
			this.vat_style = vat_style || DEFAULT_VAT_STYLE
			this.invoice_rows = invoice_rows || []
			this.footer = footer || ''
			this.autocalc = true
		})
	}
}