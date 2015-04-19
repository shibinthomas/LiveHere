(function(Backbone, Marionette, _, $) {

/*

 Copyright (C) 2013 Acquisio Inc. V0.1.1

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

Trees = Backbone.Collection.extend({

  getLeavesChecked: function() {
    var modelsChecked = this.map(function(model) {
      return model.getLeavesChecked();
    }, this);
    return _.flatten(modelsChecked);
  },

  getChildrenIds: function() {
    var modelsId = this.map(function(model) {
      return model.getChildrenIds();
    }, this);
    return _.flatten(modelsId);
  },

  countLeavesChecked: function() {
    return this.getLeavesChecked().length;
  },

  checkFromIds: function(ids) {
    this._setIsCheckedFromIds(ids, true);
  },

  uncheckFromIds: function(ids) {
    this._setIsCheckedFromIds(ids, false);
  },

  uncheckAll: function() {
    this.each(function(child) { child.uncheck(); });
  },

  checkAll: function() {
    this.each(function(child) { child.check(); });
  },

  _setIsCheckedFromIds: function(ids, isChecked) {
    this.each(function(child) { child._setIsCheckedFromIds(ids, isChecked); });
  }

});

Tree = Backbone.Model.extend({
  defaults: {
    id: 0,
    label: "Default",
    isChecked: false
  },

  initialize: function() {
    if (!this.get("children")) this.set("children", new Trees());
  },

  toggleCheckFromIds: function(ids) {
    var isChecked = !this.get("isChecked");
    this._setIsCheckedFromIds(ids, isChecked);
  },

  checkFromIds: function(ids) {
    this._setIsCheckedFromIds(ids, true);
  },

  uncheckFromIds: function(ids) {
    this._setIsCheckedFromIds(ids, false);
  },

  getChildrenIds: function() {
    if (!this.hasChildren()) return [];

    var modelsId = this.get("children").map(function(child) {
      if (child.hasChildren())
        return child.getChildrenIds();
      else
        return child.id;
    }, this);

    return _.flatten(modelsId);
  },

  // Helpers
  countLeaves: function() {
    return this._countLeavesFor($.proxy(this._inc, this));
  },

  getLeavesChecked: function() {
    if (this.get("isChecked") && !this.hasChildren()) return [this];

    var modelsChecked = this.get("children").map(function(child) {
      if (child.hasChildren())
        return child.getLeavesChecked();
      else if (child.get("isChecked"))
        return child;
      else
        return [];
    }, this);

    return _.flatten(modelsChecked);
  },

  countLeavesChecked: function() {
    return this._countLeavesFor($.proxy(this._isChecked, this));
  },

  areLeavesAllChecked: function() {
    return this.countLeavesChecked() === this.countLeaves();
  },

  hasChildren: function() {
    return !this.get("file");
  },

  toggleCheck: function() {
    var isChecked = !this.get("isChecked");
    this._setIsChecked(isChecked);
  },

  check: function() {
    this._setIsChecked(true);
  },

  uncheck: function() {
    this._setIsChecked(false);
  },

  // Internals methods
  _countLeavesFor: function(callback) {
    if (!this.hasChildren()) return callback(this, 0);
    return this.get("children").reduce(function(total, child) {
      if (child.hasChildren())
        return total + child._countLeavesFor(callback);
      else
        return total + callback(child, total);
    }, 0, this);
  },

  _setIsCheckedFromIds: function(ids, isChecked) {
    if (_.contains(ids, this.id)) this.set("isChecked", isChecked);
    this.get("children").each(function(child) { child._setIsCheckedFromIds(ids, isChecked); });
  },

  _setIsChecked: function(isChecked) {
    this.set("isChecked", isChecked);
    this.get("children").each(function(child) { child._setIsChecked(isChecked); });
  },

  // Callbacks
  _inc: function() { return 1; },

  _isChecked: function(model) {
    return model.get("isChecked");
  }

});

Trees.model = Tree;
/*

Copyright (C) 2013 Acquisio Inc. V0.1.1

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
var templateNode = _.template('\
  <a>\
    <%=(hasChildren ? "<span class=tree-view-chevron>&#9658</span>" : "")%>\
	<%=(isFile ? "<i class=fa fa-file></i>" : "<i class=fa fa-folder></i>")%>\
    <label for="<%=autoId%>" class="tree-view-label"><span class="tree-view-icon"></span><%=label%></label>\
  </a>\
  <ul class="tree-view-list">\
  </ul>\
  ');

NodeView = Marionette.CompositeView.extend({
  tagName: "li",
  className: "tree-view-node",
  template: templateNode,
  chevronRight: "&#9658;",
  chevronDown: "&#9660;",

  ui: {
    chevron: ".tree-view-chevron",
    label: ".tree-view-label",
    checkbox: ".tree-view-checkbox",
    list: ".tree-view-list",
    icon: ".tree-view-icon"
  },

  initialize: function(options) {
    this.template = options.template || this.template;

    if (this.model.hasChildren())
      this.$el.addClass("tree-view-branch");
    else
      this.$el.addClass("tree-view-leaf");
  },

  bindCollection: function() {
    this.collection = this.model.get("children");
    this.collection.off("checked");
    this.collection.on("checked", this.triggerChange, this);
    this.collection.on("checked", this.toggleMyself, this);
  },

  itemViewOptions: function() {
      return {
          lazyFetchFunction : this.options.lazyFetchFunction,
          downloadFile : this.options.downloadFile
      };
  },

  onRender: function() {
    this.bindCollection();
    this.toggleMyself();
    if (this.model.get("class")) this.ui.icon.addClass(this.model.get("class"));
  },

  appendHtml: function(collectionView, itemView){
    collectionView.ui.list.append(itemView.el);
  },

  serializeData: function() {
    return {
      autoId: _.uniqueId(),
      hasChildren: this.model.hasChildren(),
      label: this.model.get("label"),
      isChecked: this.model.get("isChecked"),
      id: this.model.id,
      isFile : this.model.get("file")
    };
  },

  events: {
    "click .tree-view-chevron" : "toggleView",
    "click .tree-view-checkbox": "onCheck",
    "click .tree-view-label"   : "downloadFile"
  },

  modelEvents: {
    "change:isChecked": "toggleCheck"
  },

  toggleMyself: function() {
    if (!this.model.hasChildren()) {
      this.ui.checkbox.prop("checked", this.model.get("isChecked"));
      return;
    }

    if (this.model.areLeavesAllChecked()) {
      this.model.check();
    } else if (this.model.countLeavesChecked() > 0 && this.model.hasChildren()) {
      this.ui.checkbox.prop("indeterminate", true);
    } else {
      this.model.set('isChecked', false);
      this.ui.checkbox.prop("checked", false);
      this.ui.checkbox.prop("indeterminate", false);
    }
  },

  toggleCheck: function() {
    this.ui.checkbox.prop("checked", this.model.get("isChecked"));
    this.ui.checkbox.prop("indeterminate", false);
    return false;
  },
  
  downloadFile : function(){
	if (_.isEqual(this.model.get("file"),true)){
      this.options.downloadFile(this.model);
    } else {
    	this.toggleView();
    }
	
	return false;
  },

  toggleView: function() {
	if (!this.$el.hasClass("open")) {
      this.options.lazyFetchFunction(this.model);
    }
	this._renderChildren();
    this.$el.toggleClass("open");
    this.switchChevron();

    return false;
  },

  switchChevron: function() {
    if (!this.model.hasChildren()) return;

    if (this.$el.hasClass("open")) {
      this.ui.chevron.html(this.chevronDown);
      this.$('.tree-view-node > a > i').removeClass('fa-folder').addClass('fa-folder-open');
    } else {
      this.ui.chevron.html(this.chevronRight);
      this.$('.tree-view-node > a > i').removeClass('fa-folder').addClass('fa-folder-close');
    }
    
    return false;
  },

  onCheck: function(e) {
    e.stopPropagation();
    this.model.toggleCheck();
    this.model.collection.trigger("checked");
  },

  expand: function() {
    this._renderChildren();
    this.$el.addClass("open");
    this.switchChevron();
    this.children.each(function(child) { child.expand(); });
  },

  collapse: function() {
    this.$el.removeClass("open");
    this.switchChevron();
    this.children.each(function(child) { child.collapse(); });
  }
});

/*

Copyright (C) 2013 Acquisio Inc. V0.1.1

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

TreeView = Marionette.CollectionView.extend({
  itemView: NodeView,
  tagName: "ul",
  className: "tree-view-root",

  itemViewOptions: function() {
    return {
      template: this.options.template,
      lazyFetchFunction : this.options.lazyFetchFunction,
      downloadFile : this.options.downloadFile
    };
  },

  expand: function() { this.children.each(function(child) { child.expand(); }); },
  collapse: function() { this.children.each(function(child) { child.collapse(); }); },
  toggleView: function() { this.children.each(function(child) { child.toggleView(); }); }
});
})(Backbone, Marionette, _, jQuery);