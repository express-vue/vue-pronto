// @ts-check

class HTML {
    /**
     * @param {object} html
     */
    constructor(html = {}) {
        this.start = html.start ? html.start : "<!DOCTYPE html><html>";
        this.end = html.end ? html.end : "</html>";
    }
}

class Body {
    /**
     * @param {object} body
     */
    constructor(body = {}) {
        this.start = body.start ? body.start : "<body>";
        this.end = body.end ? body.end : "</body>";
    }
}

class Template {
    /**
     * @param {object} template
     */
    constructor(template = {}) {
        this.start = template.start ? template.start : "<div id=\"app\">";
        this.end = template.end ? template.end : "</div>";
    }
}

class Layout {
    /**
     * Creates a layout model
     * @constructor
     * @param {object} obj
     * @property {HTML} html
     * @property {Body} body
     * @property {Template} template
     */
    constructor(obj = {}) {
        this.html = new HTML(obj.html);
        this.body = new Body(obj.body);
        this.template = new Template(obj.template);
    }
}

module.exports.Layout = Layout;
module.exports.HTML = HTML;
module.exports.Body = Body;
module.exports.Template = Template;
