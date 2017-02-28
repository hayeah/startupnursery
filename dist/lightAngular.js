var lightAngular;

$(document).ready(function () {
    lightAngular = new LightAngular();
    var $scope = new ScopeNode(),
        _ng_ifs = [],
        trashDoc = $('<div></div>');

    function LightAngular() {
        this.$scope = undefined;
    }
    LightAngular.prototype.then = function (callback) {
        callback(this.$scope);
    };
    LightAngular.prototype.init = function (context, callback) {
        var self = this;
        if (typeof context == "function" || !context) {
            callback = context;
            context = $(document);
        }
        try {
            if (CKEDITOR) CKEDITOR.replaceAll('ckeditor');
        } catch (e) {
        }
        context.find("[ng-model]").each(function () {
            var model = $scope,
                keys = $(this).attr('ng-model').split('.');

            for (var i = 0; i < keys.length; i++) {
                model = model.getChild(keys[i]);
            }
            model.addListener(new NgListener(model, this));
        });
        context.find("[ng-define]").each(function() {
            var model = $scope,
                keys = $(this).attr('ng-define').split('.');

            for (var i = 0; i < keys.length; i++) {
                model = model.getChild(keys[i]);
            }
        });
        if (this.$scope == undefined) this.$scope = $scope.toJSON();
        context.find("[ng-init]").each(function() {
            self.eval($(this).attr('ng-init'), $(this));
        });
        context.find("[ng-click]").each(function() {
            var exp = $(this).attr('ng-click'),
                self = this;
            $(self).click(function() {
                lightAngular.eval(exp, $(self));
            });
        });
        context.find("[ng-change]").each(function () {
            var exp = $(this).attr('ng-change'),
                self = this;
            $(self).change(function () {
                lightAngular.eval(exp, $(self));
            });
        });
        if (callback) callback(this.$scope);

        context.find("[ng-if]").each(function() {
            var ng_if = {
                content: $(this),
                exp: $(this).attr('ng-if'),
                replacement: $('<!-- ngIf: ' + $(this).attr('ng-if') + ' -->'),
                replaced: false
            };
            _ng_ifs.push(ng_if);
        });
        context.find("[ng-checked]").each(function () {
            var self = this,
                exp = $(this).attr('ng-checked');

            _ng_ifs.push({
                exp: function() {
                    if ($(self).prop("checked") != !!lightAngular.eval(exp, $(self))) $(self).click();
                }
            });
        });
        $scope.setAll();
        evaluateAll();
        return this;
    };
    LightAngular.prototype.eval = function(str, elt) {
        var $scope = this.$scope,
            self = elt;
        Object.keys($scope).forEach(function(key) {
            str = str.replace(new RegExp('([^."\']|^)\\b' + key + '\\b', 'g'), function(x) {
                return x.match(new RegExp('(.*)' + key))[1] + '$scope.' + key;
            });
        });
        return eval(str);
    };
    function evaluateAll() {
        _ng_ifs.forEach(function(ng_if) {
            if (typeof ng_if.exp == "function") return ng_if.exp();

            var show = lightAngular.eval(ng_if.exp, ng_if.content);
            if (show && ng_if.replaced) {
                ng_if.replacement.before(ng_if.content);
                ng_if.replacement.remove();
                ng_if.replaced = false;
                //lightAngular.init(ng_if.content);
            } else if (!show && !ng_if.replaced) {
                ng_if.content.before(ng_if.replacement);
                trashDoc.append(ng_if.content); // move element to trash
                //ng_if.content.remove();
                ng_if.replaced = true;
            }
        });
    }

    function ScopeNode() {
        this.children = {};
        this.value = undefined;
        this.listeners = [];
    }
    ScopeNode.prototype.toJSON = function() {
        var self = this;
        if (this.value) {
            return this.value
        }
        var result = {};
        Object.keys(self.children).forEach(function(key) {
            if (Object.keys(self.children[key].children).length) {
                result[key] = self.children[key].toJSON();
            } else {
                Object.defineProperty(result, key, {
                    get: function () {
                        return self.children[key].value;
                    },
                    set: function (value) {
                        self.children[key].setValue(value);
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        });
        return result;
    };
    ScopeNode.prototype.getChild = function(key) {
        if (this.children[key]) {
            return this.children[key];
        }
        return this.children[key] = new ScopeNode();
    };
    ScopeNode.prototype.addListener = function(listener) {
        this.listeners.push(listener);
    };
    ScopeNode.prototype.getListeners = function() {
        return this.listeners;
    };
    ScopeNode.prototype.setAll = function() {
        var self = this;
        if (self.value) {
            self.listeners.forEach(function(listener) {
                listener.setHtmlValue(self.value);
            });
        }
        Object.keys(self.children).forEach(function(key) {
            self.children[key].setAll();
        });
    };
    ScopeNode.prototype.setValue = function(value) {
        if (typeof this.value == typeof value && JSON.stringify(this.value) == JSON.stringify(value)) return;
        this.value = value;
        this.listeners.forEach(function(listener) {
            listener.setHtmlValue(value);
        });
        evaluateAll();
    };

    function NgListener(scopeNode, domElt) {
        var self = this;
        this.scopeNode = scopeNode;
        this.domElt = domElt;
        this.id = $(domElt).attr('id');
        if (this.scopeNode.value === undefined) this.scopeNode.value = null;
        if (this.getValueFromHtml()) this.scopeNode.value = this.getValueFromHtml();
        ['change', 'keyup'].forEach(function(key) {
            $(self.domElt).on(key, function () {
                if (self.scopeNode.value == self.getValueFromHtml()) return;
                self.scopeNode.value = self.getValueFromHtml();
                self.scopeNode.getListeners().forEach(function(listener) {
                    if (listener != self) {
                        listener.setHtmlValue(self.scopeNode.value);
                    }
                });
            });
        });

        if ($(self.domElt).get(0).tagName == 'TEXTAREA' && CKEDITOR && CKEDITOR.instances[self.id]) {
            CKEDITOR.instances[self.id].on('blur', function() {
                self.scopeNode.setValue(CKEDITOR.instances[self.id].getData());
            });
        }
    }
    NgListener.prototype.getValueFromHtml = function() {
        var self = this;
        switch ($(this.domElt).get(0).tagName) {
            case 'IMG':
            case 'IFRAME':
                return $(this.domElt).attr('src');
            case 'INPUT':
                switch ($(this.domElt).prop('type')) {
                    case 'checkbox':
                        return $(this.domElt).prop('checked');
                    case 'radio':
                        return $(this.domElt).prop('checked') ? $(this.domElt).val() : null;
                    default:
                        return $(this.domElt).val();
                }
            case 'TEXTAREA':
                if (!CKEDITOR || !CKEDITOR.instances[self.id]) {
                    return $(this.domElt).val();
                }
                return CKEDITOR.instances[self.id].getData();
            case 'SELECT':
                return $(this.domElt).val();
            default:
                if ($(this.domElt).attr("contenteditable") != "true") return;
                return $(this.domElt).text();
        }
    };
    NgListener.prototype.setHtmlValue = function(value) {
        var self = this;
        switch ($(this.domElt).get(0).tagName) {
            case 'IMG':
            case 'IFRAME':
                return $(this.domElt).attr('src', value);
            case 'INPUT':
                switch ($(this.domElt).prop('type')) {
                    case 'checkbox':
                        if ($(this.domElt).prop('checked') != !!value) $(this.domElt).click();
                        return value;
                    case 'radio':
                        if ($(this.domElt).val() == value && $(this.domElt).prop('checked') != !!value) $(this.domElt).click();
                        return value;
                    default:
                        return $(this.domElt).val(value).trigger('change');
                }
            case 'TEXTAREA':
                if (!CKEDITOR || !CKEDITOR.instances[self.id]) {
                    return $(this.domElt).val(value);
                }
                return CKEDITOR.instances[self.id].setData(value);
            case 'SELECT':
                return $(this.domElt).val(value).trigger('change');
            default:
                if ($(this.domElt).attr('ng-enable-html-inject') !== undefined) {
                    return $(this.domElt).html(value);
                }
                return $(this.domElt).text(value);
        }
    };
});