/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, jQuery, mxui */
/*mendix */
/*
    AttrRadioButtonList
    ========================

    @file      : AttrRadioButtonList.js
    @version   : 1.0
    @author    : Bailey Everitt
    @date      : Wed, 22 Jul 2015
    @copyright : Mendix
    @license   : MIT

    Documentation
    ========================
    ...
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare", "mxui/widget/_WidgetBase", "dijit/_TemplatedMixin",
    "mxui/dom", "dojo/dom", "dojo/query", "dojo/dom-prop", "dojo/dom-geometry", "dojo/dom-attr", "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "dojo/on", "dojo/_base/lang", "dojo/text",
    "dojo/_base/array", "iCheckRadioButtons/lib/jquery-1.11.2", "dojo/text!iCheckRadioButtons/widget/templates/iCheckRadioButtons.html"
], function (declare, _WidgetBase, _TemplatedMixin,
    domMx, dom, domQuery, domProp, domGeom, domAttr, domClass, domStyle, domConstruct, on, lang, text, dojoArray, _jQuery, widgetTemplate) {
    "use strict";

    // Declare widget.
    return declare("iCheckRadioButtons.widget.AttrRadioButtonList", [_WidgetBase, _TemplatedMixin], {

        // Template path
        templateString: widgetTemplate,

        /**
         * Internal variables.
         * ======================
         */
        _wgtNode: null,
        _attrDisable: false,

        _mxObj: null,

        /**
         * Extra setup widget methods.
         * ======================
         */
        constructor: function () {

            this._mxObj = null;
            this.keyNodeArray = null;
            this.handles = null;


            // To be able to just alter one variable in the future we set an internal variable with the domNode that this widget uses.
            this._wgtNode = this.domNode;

        },

        /**
         * Mendix Widget methods.
         * ======================
         */

        // DOJO.WidgetBase -> PostCreate is fired after the properties of the widget are set.
        postCreate: function () {
            console.log("AttrRadioButtonList - postCreate");

            this.keyNodeArray = {};
            if (this.readonly) {
                this._attrDisable = true;
            }
            this._wgtNode = this.domNode;
        },

        /**
         * What to do when data is loaded?
         */

        _preInitRadioButtonList: function (obj) {
            var enumerationObj = null;
            try {
                if (this.entity !== "") {
                    //get enumeration for current attribute
                    if (obj.getAttributeType(this.entity) === "Enum") {
                        enumerationObj = obj.getEnumKVPairs(this.entity);
                    } else if (obj.getAttributeType(this.entity) === "Boolean") {
                        enumerationObj = {};
                        enumerationObj["true"] = this.captiontrue;
                        enumerationObj["false"] = this.captionfalse;
                    }
                    this._initRadioButtonList(enumerationObj);
                }
            } catch (err) {
                console.error(this.id + ".update: error while loading attr " + err);
            }
        },

        update: function (obj, callback) {
            console.log("AttrRadioButtonList - update");

            var errorhandled = null,
                validationhandle = null,
                refreshhandle = null,
                refreshAttHandle = null;

            if (this.handles) {
                dojoArray.forEach(this.handles, lang.hitch(this, function (handle, i) {
                    this.unsubscribe(handle);
                }));
            }

            //load embedded
            errorhandled = false;

            if (obj) {
                domStyle.set(this.domNode, 'display', 'block');
                this._mxObj = obj;

                this._preInitRadioButtonList(obj);

                validationhandle = mx.data.subscribe({
                    guid: obj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, function (validations) {
                        var val = validations[0],
                            msg = val.getReasonByAttribute(this.entity);

                        if (this.readonly) {
                            val.removeAttribute(this.entity);
                        } else {
                            if (msg) {
                                this.addError(msg);
                                val.removeAttribute(this.entity);
                            }
                        }
                    })
                });

                refreshhandle = mx.data.subscribe({
                    guid: obj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        mx.data.get({
                            guids: [guid],
                            callback: lang.hitch(this, function (objs) {
                                this._mxObj = objs[0];
                                this._preInitRadioButtonList(this._mxObj);
                            })
                        });
                    })
                });

                refreshAttHandle = mx.data.subscribe({
                    guid: obj.getGuid(),
                    attr: this.entity,
                    callback: lang.hitch(this, function (guid) {
                        mx.data.get({
                            guids: [guid],
                            callback: lang.hitch(this, function (objs) {
                                this._mxObj = objs[0];
                                this._preInitRadioButtonList(this._mxObj);
                            })
                        });
                    })
                });

                this.handles = [validationhandle, refreshhandle, refreshAttHandle];

            } else {
                console.log(this.id + ".update: received null object");
                domStyle.set(this.domNode, 'display', 'none');
            }

            // Execute callback.
            callback();
        },

        uninitialize: function () {
            if (this.handles) {
                dojoArray.forEach(this.handles, lang.hitch(this, function (handle, i) {
                    this.unsubscribe(handle);
                }));
            }
        },


        /**
         * Interaction widget methods.
         * ======================
         */
        _initRadioButtonList: function (enumObj) {
            var nd = domConstruct.create,
                i = 0,
                attrName = null,
                key = null,
                radioid = null,
                labelNode = null,
                rbNode = null,
                iCheckNode = null,
                textDiv = null,
                radiodiv = null;

            domConstruct.empty(this.domNode);

            attrName = this._mxObj.get(this.entity);

            for (key in enumObj) {
                if (enumObj.hasOwnProperty(key)) {
                    radioid = this.entity + "_" + this.id + "_" + i;

                    labelNode = nd("label");

                    iCheckNode = nd("div", {
                        "class": "iradio_" + this.iCheckStyle + "-" + this.iCheckColor
                    });

                    rbNode = nd("input", {
                        "type": "radio",
                        "value": key,
                        "id": radioid
                    });

                    domAttr.set(rbNode, "name", "radio" + this._mxObj.getGuid() + "_" + this.id);

                    this.keyNodeArray[key] = rbNode;

                    if (this._attrDisable) {
                        domClass.add(iCheckNode, "disabled");
                    }

                    if (attrName === key) {
                        domAttr.set(rbNode, "defaultChecked", true);
                        domClass.add(labelNode, "checked");
                        domClass.add(iCheckNode, "checked");
                        this.selectedValue = key;
                    }
                    
                    if (this._mxObj.isBoolean(this.entity)) {
                        if (attrName == true && key == "true") {
                            domClass.add(iCheckNode, "checked");
                        } else if (attrName == false && key == "false") {
                            domClass.add(iCheckNode, "checked");
                        }
                    }

                    textDiv = nd("label", {
                        "for": "radio" + this._mxObj.getGuid() + "_" + this.id,
                        "style": "margin-left: 15px; margin-right: 5px;"
                    });

                    textDiv.innerHTML = enumObj[key];

                    this.connect(labelNode, "onclick", lang.hitch(this, this._onChangeRadio, rbNode, iCheckNode, key));

                    domConstruct.place(iCheckNode, labelNode, "last");
                    domConstruct.place(rbNode, iCheckNode, "last");
                    domConstruct.place(textDiv, labelNode, "last");

                    if (this.direction === "horizontal") {
                        domClass.add(labelNode, "radio-inline");
                        domConstruct.place(labelNode, this.domNode, "last");
                    } else {
                        radiodiv = nd("div", {
                            "class": "radio"
                        });
                        domConstruct.place(labelNode, radiodiv, "last");
                        domConstruct.place(radiodiv, this.domNode, "last");
                    }

                    i++;
                }
            }
        },

        _onChangeRadio: function (rbNode, iCheckNode, enumkey) {

            if (this._attrDisable) {
                return;
            }

            domAttr.set(rbNode, "checked", true);
            domAttr.set(iCheckNode, "checked", true);
            
            this.selectedValue = enumkey;
            this._setValue(enumkey);
            this._triggerMicroflow();

        },

        //invokes the microflow coupled to the tag editor
        _triggerMicroflow: function () {

            if (this.onchangeAction) {
                mx.data.action({
                    params: {
                        applyto: "selection",
                        actionname: this.onchangeAction,
                        guids: [this._mxObj.getGuid()]
                    },
                    error: function (error) {
                        console.log("RadioButtonList.widget.AssocRadioButtonList._triggerMicroflow: XAS error executing microflow; " + error.description);
                    }
                });
            }

        },

        _setDisabledAttr: function (value) {
            if (!this.readonly) {
                this._attrDisable = !!value;
            }
        },

        _setValue: function (oldvalue) {
            var value = oldvalue,
                boolvalue = null;

            if (this.selectedValue !== null) {
                if (this.selectedValue !== "" && this.keyNodeArray[this.selectedValue]) {
                    this.keyNodeArray[this.selectedValue].checked = false;
                    this.keyNodeArray[this.selectedValue].defaultChecked = false;
                    domClass.remove(this.keyNodeArray[this.selectedValue].parentNode, "checked");
                }
            }

            if (this._mxObj !== null) {

                if (this._mxObj.isBoolean(this.entity)) {
                    boolvalue = oldvalue === "true" ? true : false;
                    this._mxObj.set(this.entity, boolvalue);
                    this.selectedValue = boolvalue;
                } else {
                    this._mxObj.set(this.entity, value);
                    this.selectedValue = value;
                }
            }

            if (value !== "" && this.keyNodeArray[value]) {
                this.keyNodeArray[this.selectedValue].checked = true;
                this.keyNodeArray[this.selectedValue].defaultChecked = true;
                domClass.add(this.keyNodeArray[this.selectedValue].parentNode, "checked");
            }
        }

    });
});
require(["iCheckRadioButtons/widget/AttrRadioButtonList"], function () {
    "use strict";
});