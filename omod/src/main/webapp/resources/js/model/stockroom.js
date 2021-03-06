/*
 * The contents of this file are subject to the OpenMRS Public License
 * Version 2.0 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://license.openmrs.org
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 *
 * Copyright (C) OpenMRS, LLC.  All Rights Reserved.
 */
define(
	[
		openhmis.url.backboneBase + 'js/openhmis',
		openhmis.url.backboneBase + 'js/lib/i18n',
		openhmis.url.backboneBase + 'js/model/generic',
		openhmis.url.backboneBase + 'js/model/location'
	],
	function(openhmis, __) {
        openhmis.Stockroom = openhmis.GenericModel.extend({
			meta: {
				name: __("Stockroom"),
				namePlural: __("Stockrooms"),
				openmrsType: 'metadata',
				restUrl: openhmis.url.inventoryModelBase + 'stockroom'
			},

			schema: {
				name: { type: 'Text' },
				location: {
					type: 'LocationSelect',
					options: new openhmis.GenericCollection(null, {
						model: openhmis.Location,
						url: 'v1/location'
					}),
					objRef: true
				}
			},

			validate: function(attrs, options) {
				if (!attrs.name) return { name: __("A name is required.") };
				return null;
			},

			parse: function(resp) {
				if (resp) {
					if (resp.location && _.isObject(resp.location)) {
						resp.location = new openhmis.Location(resp.location);
					}
				}
				return resp;
			},

			toString: function() {
				return this.get('name');
			}
		});

		openhmis.ItemStock = openhmis.GenericModel.extend({
			meta: {
				name: __("Item Stock"),
				namePlural: __("Item Stock"),
				openmrsType: 'metadata',
				restUrl: openhmis.url.inventoryModelBase + 'itemStock'
			},

			schema: {
				stockroom: {
					type: 'StockroomSelect',
					options: new openhmis.GenericCollection(null, {
						model: openhmis.Stockroom,
						url: openhmis.url.inventoryModelBase + '/stockroom'
					}),
					objRef: true
				},
				item: {
					type: 'ItemSelect',
					options: new openhmis.GenericCollection(null, {
						model: openhmis.Item,
						url: openhmis.url.inventoryModelBase + '/item'
					}),
					objRef: true
				},
				quantity: {
					type: 'BasicNumber'
				},
				details: { type: 'List', itemType: 'NestedModel', model: openhmis.ItemStockDetail }
			},

			validate: function(attrs, options) {
				if (!attrs.quantity) return { quantity: __("An item quantity is required.") };
				if (!attrs.item || !attrs.item.id) return { item: __("Please choose an item") };

				return null;
			},

			parse: function(resp) {
				if (resp) {
					if (resp.item && _.isObject(resp.item)) {
						resp.item = new openhmis.Item(resp.item);
					}
					if (resp.stockroom && _.isObject(resp.stockroom)) {
						resp.stockroom = new openhmis.Stockroom(resp.stockroom);
					}
				}

				return resp;
			},

			toString: function() {
				return this.get('item.name');
			}
		});

        openhmis.ItemStockDetailBase = openhmis.GenericModel.extend({
            meta: {},
            schema: {},

            initialize: function(attributes, options) {
                openhmis.GenericModel.prototype.initialize.call(this, attributes, options);

                this.schema.item = { type: 'NestedModel', model: openhmis.Item, objRef: true };
                this.schema.quantity = { type: 'BasicNumber' };
                this.schema.expiration = { type: 'Date', format: openhmis.dateFormatLocale };

                this.schema.batchOperation = {
                    type: 'OperationSelect',
                    model: openhmis.Operation,
                    url: openhmis.url.inventoryModelBase + '/stockOperation'
                };

                this.schema.calculatedExpiration = {type: 'checkbox'};
                this.schema.calculatedBatch = {type: 'checkbox'};
            },

            parse: function(resp) {
                if (resp) {
                    if (resp.batchOperation && _.isObject(resp.batchOperation)) {
                        resp.batchOperation = new openhmis.Operation(resp.batchOperation);
                    }

                    if (resp.item && _.isObject(resp.item)) {
                        resp.item = new openhmis.Item(resp.item);
                    }
                }

                return resp;
            }
        });

		openhmis.ItemStockDetail = openhmis.ItemStockDetailBase.extend({
			meta: {
				name: __("Item Stock Detail"),
				namePlural: __("Item Stock Detail"),
				openmrsType: 'metadata',
				restUrl: openhmis.url.inventoryModelBase + 'itemStockDetail'
			},

			schema: {
				stockroom: {
					type: 'StockroomSelect',
					options: new openhmis.GenericCollection(null, {
						model: openhmis.Stockroom,
						url: openhmis.url.inventoryModelBase + '/stockroom'
					}),
					objRef: true
				}
			},

			toString: function() {
				return this.get('item.name');
			}
		});

        return openhmis;
	}
);
