Backbone.Marionette.TemplateCache.storeTemplate = function (templateId, template) {
    // compile template and store in cache
    template = Backbone.Marionette.TemplateCache.prototype.compileTemplate(template);
    if (templateId[0] != "#") templateId = "#" + templateId;
    var cachedTemplate = new Backbone.Marionette.TemplateCache(templateId);
    cachedTemplate.compiledTemplate = template;
    Backbone.Marionette.TemplateCache.templateCaches[templateId] = cachedTemplate;
};