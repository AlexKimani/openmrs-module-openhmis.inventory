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
    openhmis.url.backboneBase + 'js/lib/jquery',
    openhmis.url.backboneBase + 'js/lib/backbone',
    openhmis.url.backboneBase + 'js/lib/underscore',
    openhmis.url.inventoryBase + 'js/model/item',
    openhmis.url.inventoryBase + 'js/model/department',
    openhmis.url.inventoryBase + 'js/model/category',
    openhmis.url.inventoryBase + 'js/view/search',
    openhmis.url.inventoryBase + 'js/model/operation',
    openhmis.url.backboneBase + 'js/lib/backbone-forms',
    openhmis.url.backboneBase + 'js/lib/labelOver',
    openhmis.url.backboneBase + 'js/view/editors',
    openhmis.url.backboneBase + 'js/model/concept'
  ],
  function($, Backbone, _, openhmis) {
    var editors = Backbone.Form.editors;

    editors.DepartmentSelect = editors.GenericModelSelect.extend({
      modelType: openhmis.Department,
      displayAttr: "name"
    });

    editors.CategorySelect = editors.GenericModelSelect.extend({
        modelType: openhmis.Category,
        displayAttr: "name",
        allowNull: true
    });

    editors.ItemPriceSelect = editors.GenericModelSelect.extend({
      modelType: openhmis.ItemPrice,
      displayAttr: "price"
    });

    editors.StockroomSelect = editors.GenericModelSelect.extend({
      modelType: openhmis.Stockroom,
      displayAttr: "name",
      allowNull: true
    });

    editors.OperationTypeSelect = editors.GenericModelSelect.extend({
        modelType: openhmis.OperationType,
        displayAttr: "name"
    });

    editors.DefaultExpirationPeriodStepper = editors.Base.extend({
        tagName: "span",
        className: "editor",
        tmplFile: openhmis.url.inventoryBase + 'template/editors.html',
        tmplSelector: '#defaultExpirationPeriodStepper-editor',

        initialize: function(options) {
            this.events = _.extend({}, this.events, {
                'keypress': 'onKeyPress'
            });
            _.bindAll(this);
            editors.Base.prototype.initialize.call(this, options);
            this.template = this.getTemplate();
        },

        events: {
            'change #defaultExpirationPeriod': 'update'
        },

        onKeyPress: function(event) {
            //this is for firefox as arrows are detected as keypress events
            if ($('input[name=defaultExpirationPeriod]').is(':focus')) {
                var view = this;
                if(event.keyCode === 38 /*arrow up*/) {
                    if (this.value == null) {
                        this.value = 0;
                    }
                    var defaultExpirationPeriod = this.value;
                    this.$('#defaultExpirationPeriod').val(defaultExpirationPeriod + 1)
                    this.update();
                }
                if(event.keyCode === 40 && this.value != null /*arrow down*/) {
                    var defaultExpirationPeriod = this.value;
                    if (defaultExpirationPeriod > 0) {
                        this.$('#defaultExpirationPeriod').val(defaultExpirationPeriod - 1)
                        this.update();
                    }
                }
            }
        },

        getValue: function() {
            return this.value;
        },

        update: function() {
            var tmp = this.$('#defaultExpirationPeriod').val();
            if (tmp != null && tmp != '') {
                this.value = parseInt(tmp);
            } else {
                this.value = null;
            }
        },

        render: function() {
            this.$el.html(this.template({
                defaultExpirationPeriod: this.value,
            }));
            this.$('input[type=number]').stepper({
                allowArrows: false,
                limit: [0, null],
                onStep: this.update
            });
            this.$('#outer-span-stepper').removeClass("ui-widget-content-spinner")
            .removeClass("ui-spinner-input-spinner")
            .addClass("ui-spinner-input-spinner-border")
            .addClass("ui-widget-content-spinner-border");
            return this;
        },

    });

    editors.ConceptInput = editors.Base.extend({
        tagName: "span",
        className: "editor",
        tmplFile: openhmis.url.inventoryBase + 'template/editors.html',
        tmplSelector: '#conceptInput',

        initialize: function(options) {
            _.bindAll(this);
            editors.Base.prototype.initialize.call(this, options);
            this.cache = {};
            this.template = this.getTemplate();
        },

        events: {
            'blur .concept-display': 'handleBlur',
        },

        handleBlur: function() {
        	this.handleSpinnerHide();
            if ($('.concept-display').val() == '') {
                $('.concept').val('');
            }
        },

        getValue: function() {
            return this.value;
        },

        doConceptSearch: function(request, response) {
            var term = request.term;
            var query = "?q=" + encodeURIComponent(term);
            this.doSearch(request, response, openhmis.Concept, query);
          },

        doSearch: function(request, response, model, query) {
            this.handleSpinnerShow();
            var term = request.term;
            if (query in this.cache) {
              response(this.cache[query]);
              this.handleSpinnerHide();
              return;
            }
            var resultCollection = new openhmis.GenericCollection([], { model: model });
            var view = this;
            var fetchQuery = query ? query : "?q=" + encodeURIComponent(term);
            resultCollection.fetch({
                url: "/openmrs/ws/rest/v1/concept" + fetchQuery,
                success: function(collection, resp) {
                    view.handleSpinnerHide();
                    var data = collection.map(function(model) { return {
                        val: model.id,
                        display: model.get('display'),
                    }});
                    view.cache[query] = data;
                    response(data);
                }
            });
        },

        selectConcept: function(event, ui) {
            var uuid = ui.item.val;
            var name = ui.item.display;
            this.$('.concept-display').val(name);
            this.$('.concept').val(uuid);
            event.preventDefault();
        },

        render: function() {
            var self = this;
            this.$el.html(this.template({
                concept: this.model.attributes.concept,
                item_id: self.model.cid,
            }));
            this.$('.concept-display').autocomplete({
                minLength: 2,
                source: this.doConceptSearch,
                select: this.selectConcept
              })
              // Tricky stuff here to get the autocomplete list to render with our custom data
              .data("autocomplete")._renderItem = function(ul, concept) {
                return $("<li></li>").data("concept.autocomplete", concept)
                  .append("<a>" + concept.display + "</a>").appendTo(ul);
            };
            this.handleSpinnerHide();
            return this;
        },

        handleSpinnerHide: function () {
            this.$('#conceptDisplay').removeClass('spinner-float-style');
            this.$('.spinner').hide();
        },

        handleSpinnerShow: function () {
        	this.$('#conceptDisplay').addClass('spinner-float-style');
        	this.$('.spinner').show();
        },

        renderInput: function() {
            $('#conceptBox').append('<input id="conceptInput" type="text" placeholder="Enter concept name or id"><input type="hidden" class="concept-uuid" name="concept"/>');
        }

    });

    editors.ItemListSelect = editors.ListSelect.extend({
      modalWidth: 750,
      initListView: function() {
          var options = this.schema.editorOptions || {};
          options.model = this.schema.options;
          options.searchView = openhmis.DepartmentAndNameSearchView;
          this.listView = new openhmis.GenericSearchableListView(options);
      }
    });

    return editors;
  }
)
