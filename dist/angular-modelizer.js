/* 
 * angular-modelizer v0.2.7
 * 
 * Simple models to use with AngularJS
 * Loose port of Backbone models, a bit of Restangular and Ember Data.
 */

'use strict';

;(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['angular'], function (angular) {
      return factory(angular, document);
    });
  } else {
    /* global angular */
    factory(angular, document);
  }

}(window, function (angular, document, undefined) {

  var defaultModelClass;

  // Convenience method to allow throwing Errors
  // where not correct otherwise (inline in conditions, etc)
  // according to jshint
  var _error = function (errorMessage) {
    throw new Error(errorMessage);
  };

  // Underscore / lodash methods

  // Exposes a strictly necessary subset of underscore/lodash
  // functionality. Similar to how Angular implements jqLite for
  // internal usage. Supported (or partially supported) methods are:
  // - isObject
  // - isString
  // - isArray
  // - isArguments
  // - isFunction
  // - isNumber
  // - isEqual
  // - extend
  // - has
  // - indexOf
  // - keys
  // - values
  // - pairs
  // - contains
  // - flatten
  // - difference
  // - without
  // - map
  // - iteratee
  // - matches
  // - any
  // - filter
  // - find
  // - clone
  // - uniqueId

  var _idCounter = 0;

  var _ = {};

  _.isString = function (str) {
    return angular.isString(str);
  };

  _.isNumber = function (num) {
    return angular.isNumber(num);
  };

  _.isObject = function (value) {
    var type = typeof value;
    return type === 'function' || (value && type === 'object') || false;
  };

  _.isArray = function (arr) {
    return angular.isArray(arr);
  };

  _.isArguments = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Arguments]';
  };

  _.isFunction = function (fn) {
    return angular.isFunction(fn);
  };

  _.isEqual = function (o1, o2) {
    return angular.equals(o1, o2);
  };

  _.isEmpty = function (obj) {
    if (obj === null || obj === void 0) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  _.extend = function (obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (Object.prototype.hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }

    return obj;
  };

  _.has = function(obj, key) {
    return obj && Object.prototype.hasOwnProperty.call(obj, key);
  };

  _.indexOf = function (arr, item) {
    if (!arr || !arr.length) return -1;
    for (var i = 0; i < arr.length; i++) if (arr[i] === item) return i;
    return -1;
  };

  _.keys = function (obj) {
    if (!_.isObject(obj)) return [];
    if (Object.keys) return Object.keys(obj);

    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);

    return keys;
  };

  _.values = function (obj) {
    var keys = _.keys(obj),
        length = keys.length,
        values = new Array(length);

    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }

    return values;
  };

  _.pairs = function (obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  _.contains = function (obj, target) {
    if (!obj) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  _.flatten = function (input, shallow, strict, output) {
    strict = !!strict;
    output = output || [];

    if (shallow && _.isArray(input) && input.length > 0) {
      var allArrays = true;
      for (var m = 0; m < input.length; m++) {
        if (!_.isArray(input[m])) {
          allArrays = false;
          break;
        }
      }

      if (allArrays) return Array.prototype.concat.apply(output, input);
    }

    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        Array.prototype.push.apply(output, value);
      } else {
        _.flatten(value, shallow, strict, output);
      }
    }

    return output;
  };

  _.difference = function (arr) {
    var rest = _.flatten(Array.prototype.slice.call(arguments, 1), true, true, []);
    return _.filter(arr, function (value) {
      return !_.contains(rest, value);
    });
  };

  _.without = function (arr) {
    return _.difference(arr, Array.prototype.slice.call(arguments, 1)); 
  };

  _.map = function (obj, mapFn) {
    return Array.prototype.map.call(obj, mapFn);
  };

  _.iteratee = function (value) {
    if (!value) return angular.identity;
    if (_.isFunction(value)) {
      var fn = value;

      // We only have single case here as opposed to underscore/lodash
      return function (val, index, collection) {
        return fn.call(null, val, index, collection);
      };
    }

    if (_.isObject(value)) {
      return _.matches(value);
    }

    var propFn = function (key) {
      return function (obj) {
        return obj[key];
      };
    };

    return propFn(value);
  };

  _.matches = function (attrs) {
    var pairs = _.pairs(attrs),
        length = pairs.length;

    return function (obj) {
      if (!obj) return !length;

      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i],
            key = pair[0];

        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }

      return true;
    };
  };

  _.any = function (obj, predicate) {
    if (!obj) return false;

    predicate = _.iteratee(predicate);

    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;

    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }

    return false;
  };

  _.find = function (obj, predicate) {
    var result;

    predicate = _.iteratee(predicate);

    _.any(obj, function (value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });

    return result;
  };

  _.filter = function (obj, predicate) {
    var results = [];
    if (!obj) return results;

    predicate = _.iteratee(predicate);

    angular.forEach(obj, function (value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });

    return results;
  };

  _.clone = function (obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  _.uniqueId = function (prefix) {
    var id = ++_idCounter;
    return String(prefix === null ? '' : prefix) + id;
  };


  // Simple methods that are not underscore/lodash
  // but mostly simplified versions to prevent moving
  // too much code from lodash here.

  // Only supports string prop names as opposed to _.omit()
  var _omitProps = function (obj) {
    if (!obj) return {};
    if (!_.isObject(obj)) return obj;
    
    var toOmit = Array.prototype.slice.call(arguments, 1),
        keys = _.keys(obj),
        result = {};

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key in obj && !_.contains(toOmit, key)) result[key] = obj[key];
    }

    return result;
  };

  // Half-deep-clone. Works in conjunction with _extendWithGetSet
  // Will possibly be combined together.
  var _deepClone = function (value, extendFn) {
    if (!value) return value;
    if (!extendFn || !_.isFunction(extendFn)) extendFn = _.extend;

    if (_.isArray(value)) {
      var arr = _.clone(value);
      for (var i = 0; i < arr.length; i++) {
        arr[i] = _deepClone(arr[i]);
      }

      return arr;
    } else if (_.isFunction(value)) {
      return value;
    } else if (_.isObject(value)) {
      // Regular object is just extended using "structured clone"
      // approach with possibly custom `extend` function
      return extendFn({}, value);
    } else {
      return value;
    }
  };

  var _extendWithGetSet = function (dst) {
    dst = dst || {};
    angular.forEach(arguments, function (obj) {
      if (obj !== dst && _.isObject(obj)) {
        for (var key in obj) {
          var propertyDescriptor = Object.getOwnPropertyDescriptor(obj, key);

          // If we encounter a getter function,
          if (propertyDescriptor && (propertyDescriptor.get || propertyDescriptor.set)) {
            // Manually copy the definition across rather than doing a regular copy, as the latter
            // approach would result in the getter function being evaluated. Need to make it
            // enumerable so subsequent mixins pass through the getter.
            var getter = propertyDescriptor.get || undefined,
                setter = propertyDescriptor.set || undefined;

            Object.defineProperty(
              dst, key, { get: getter, set: setter, enumerable: true, configurable: true }
            );
          } else {
            // Otherwise, just do a full clone
            dst[key] = _deepClone(obj[key], _extendWithGetSet);
          }
        }
      }
    });

    return dst;
  };


  // # Internal helpers
  // ==================

  // Helper to assist URL-related checks and transformations
  var urlHelper = {
    isLikeUrl: function (str) {
      // Pretty dumb and straightforward check will suffice
      // Possible TODO: Might also need checking for '%', '^', etc
      return _.contains(str, '/') || _.contains(str, '-');
    },

    asUrl: function (str) {
      if (!str) return '';
      return urlHelper.stripDoubleSlashes('/' + str);
    },

    // Accepts any number of arguments
    combineUrls: function (url1, url2, url3) {
      var args = _.filter(
        Array.prototype.slice.call(arguments),
        function (item) { return !!item; });

      return urlHelper.asUrl(args.join('/'));
    },

    stripDoubleSlashes: function (url) {
      if (!url) return '';
      return url.replace(/(\/)\/+/g, '$1');
    },

    // Gets rid of leading and trailing slash
    trimSlashes: function (url) {
      return url.replace(/^\/|\/$/g, '');
    },

    stripOverlap: function (url, overlapUrl) {
      if (!url || !overlapUrl) return url;

      var urlSections      = urlHelper.trimSlashes(url).split('/'),
          otherUrlSections = urlHelper.trimSlashes(overlapUrl).split('/'),
          intersection     = [],
          isMatching       = false;

      // Normalize so that both array are of the same length
      if (urlSections.length > otherUrlSections.length) {
        // We need to cut this from the start
        urlSections.splice(0, urlSections.length - otherUrlSections.length);
      } else {
        // This should be normally cut from the end
        otherUrlSections.length = urlSections.length;
      }

      // Find the intersection
      while (urlSections.length) {

        for (var i = 0; i < urlSections.length; i++) {
          if (urlSections[i] === otherUrlSections[i]) {
            isMatching = true;
            intersection.push(urlSections[i]);
          } else {
            intersection = [];
            isMatching = false;
            break;
          }
        }

        if (isMatching) break;

        urlSections.shift();    // <-- []
        otherUrlSections.pop(); // [] -->
      }

      // Cut out the intersection from the end of passed `url` and return as URL
      var intersectionStr = urlHelper.asUrl(intersection.join('/'));
      return urlHelper.asUrl(intersectionStr.length ? url.substring(0, url.indexOf(intersectionStr)) : url);
    },

    // URL params helper method.
    // Takes actual param values from `params`
    // and sets them in place of URL param names
    // defined with colons (like `/some/url/:id`).
    setUrlParams: function (url, params, ignoreMissing) {
      if (!url) return url;

      return url.replace(/\:\_*[A-Za-z]+/g, function (param) {
        param = param.replace(/\:*/, '');
        if (params[param] === undefined && !ignoreMissing) _error('No parameter "'+ param + '" is available for URL ' + url);
        return params[param];
      });
    },

    // Conventionally appends the model `id` (or whatever
    // attribute is set as `idAttribute`) assuming some "base"
    // URL is passed as an argument.
    // `isValue` determines whether the supplied `idAttribute`
    // is actually a value and should be appended to URL right away.
    appendIdParam: function (url, idAttribute, isValue) {
      if (!url) return url;
      return url.replace(/([^\/])$/, '$1/') + (isValue ? idAttribute : ':' + (idAttribute || 'id'));
    },

    buildRestfulUrl: function (baseUrl, isCollection, resourceId) {
      return isCollection ? urlHelper.asUrl(baseUrl) : urlHelper.asUrl(urlHelper.appendIdParam(baseUrl, resourceId, true));
    }
  };

  // Tiny string helper to simplify string operations
  var stringHelper = {
    capitalize: function (str) {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    pluralize: function (str) {
      if (!str) return str;
      return (str.charAt(str.length) === 's') ? str + 'es' : str + 's';
    },

    toDashCase: function (str) {
      if (!str) return str;
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
  };


  // Global model class cache for fast
  // lookups of model classes when "modelizing"
  var modelClassCache = {
    
    byModelName:      {},
    byCollectionName: {},
    byBaseUrl:        {},

    addModelClass: function (modelClass) {
      if (!modelClass ||  !modelClass._modelClassMeta) return;

      var meta = modelClass._modelClassMeta;

      if (meta.modelName) this.byModelName[meta.modelName] = modelClass;
      if (meta.collectionName) this.byCollectionName[meta.collectionName] = modelClass;
      if (modelClass.baseUrl && modelClass !== '/' && !this.byBaseUrl[modelClass.baseUrl]) {
        this.byBaseUrl[modelClass.baseUrl] = modelClass;
      }
    }
  };


  // Internal helper (exposed as modelize.attr property)
  // to help define complex attributes in a way similar to Ember.Data DS.attr(...)
  var attrBuilder = {

    // Returns function that defines nested model property
    // on object (model prototype in our case).
    model: function (attrDefinition) {
      /* Expected `attrDefinition` format:
       * {
       *   modelClass: SomeModel,
       *
       *   // Other options
       * }
       */

      var modelClass  = attrDefinition.modelClass,
          options     = _omitProps(attrDefinition, 'modelClass'),
          isLazyClass = !modelClass || _.isString(modelClass);

      var initializerFn = function (obj, propertyName) {
        var _value = null;

        var _modelClass;
        if (modelClass && isLazyClass) {
          _modelClass = modelClassCache.byModelName[modelClass] ||
                        modelClassCache.byModelName[propertyName];
        } else if (modelClass) {
          _modelClass = modelClass;
        }

        if (!_modelClass) _modelClass = defaultModelClass;

        attrDefinition.modelClass = _modelClass;

        Object.defineProperty(obj, propertyName, {
          enumerable: true,
          configurable: true,
          get: function () {
            return _value;
          },
          set: function (value) {
            if (!value) {
              _value = value;
              return;
            }

            if (value instanceof _modelClass) {
              _value = value;
            } else if (_.isObject(value)) {
              _value = _modelClass.$new(value, options);
            }
          }
        });
      };

      attrDefinition.attrType = 'model';
      initializerFn.attrDefinition = attrDefinition;
      initializerFn.isPropertyInitializer = true;

      return initializerFn;
    },

    // Returns function that defines collection property
    // on object (model prototype in our case).
    collection: function (attrDefinition) {
      /* Expected `attrDefinition` format:
       * {
       *   modelClass: SomeModel,
       *
       *   // Other options
       * }
       */

      var modelClass  = attrDefinition.modelClass,
          options     = _omitProps(attrDefinition, 'modelClass'),
          isLazyClass = !modelClass || _.isString(modelClass);

      var initializerFn = function (obj, propertyName) {
        var _value = null;

        var _modelClass;
        if (modelClass && isLazyClass) {
          _modelClass = modelClassCache.byModelName[modelClass] ||
                        modelClassCache.byModelName[propertyName];
        } else if (modelClass) {
          _modelClass = modelClass;
        }

        if (!_modelClass) _modelClass = defaultModelClass;

        attrDefinition.modelClass = _modelClass;

        Object.defineProperty(obj, propertyName, {
          enumerable: true,
          configurable: true,
          get: function () {
            if (!_value) {
              _value = _modelClass.$newCollection(null, options);
            }

            return _value;
          },
          set: function (value) {
            if (!_value) {
              _value = _modelClass.$newCollection(value, options);
            } else {
              _value.reset(value);
            }
          }
        });
      };

      attrDefinition.attrType = 'collection';
      initializerFn.attrDefinition = attrDefinition;
      initializerFn.isPropertyInitializer = true;

      return initializerFn;
    },

    // WIP
    date: function (attrDefinition) {
      var initializerFn = function (obj, propertyName) {
        var _value = null;

        Object.defineProperty(obj, propertyName, {
          enumerable: true,
          configurable: true,
          get: function () {
            if (!_value) {
              _value = new Date(0);
            }

            return _value;
          },
          set: function (value) {
            if (value instanceof Date) _value = value;
            else if (_.isString(value) || _.isNumber(value)) _value = Date(value);
          }
        });
      };

      attrDefinition.attrType = 'date';
      initializerFn.attrDefinition = attrDefinition;
      initializerFn.isPropertyInitializer = true;

      return initializerFn;
    },

    computed: function (computeFn) {
      var initializerFn = function (obj, propertyName) {
        Object.defineProperty(obj, propertyName, {
          enumerable: true,
          configurable: true,
          get: function () {
            return computeFn.apply(this);
          }
        });
      };

      initializerFn.attrDefinition = { attrType: 'computed' };
      initializerFn.isPropertyInitializer = true;

      return initializerFn;
    }
  };

  // Helper to assist model class building and introspection
  var modelClassHelper = {
    isModelClass: function (modelClass) {
      return modelClass.prototype instanceof defaultModelClass;
    },

    isDefaultModelClass: function (modelClass) {
      return modelClass === defaultModelClass;
    },

    hasSpecialAttr: function (modelClass, propName) {
      if (!modelClass || !modelClass._modelClassMeta ||
          !modelClass._modelClassMeta.propertyInitializers) return false;

      return !!modelClass._modelClassMeta.propertyInitializers[propName];
    },

    hasCollectionAttr: function (modelClass, propName) {
      var attrDefinition = this.getSpecialAttrMeta(modelClass, propName);

      return attrDefinition && attrDefinition.attrType === 'collection';
    },

    hasModelAttr: function (modelClass, propName) {
      var attrDefinition = this.getSpecialAttrMeta(modelClass, propName);

      return attrDefinition && attrDefinition.attrType === 'model';
    },

    getSpecialAttrMeta: function (modelClass, propName) {
      if (!this.hasSpecialAttr(modelClass, propName)) return null;

      return modelClass._modelClassMeta.propertyInitializers[propName].attrDefinition;
    },

    // Note: Thanks to Backbone!
    // Helper function to correctly set up the prototype chain for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    extendClass: function (superclass, protoProps, staticProps, className) {
      var extended;
      className = className || 'Extended';

      // The constructor function for the new subclass is either defined by you
      // (the "constructor" property in your `extend` definition), or defaulted
      // by us to simply call the superclass's constructor.
      if (protoProps && _.has(protoProps, 'constructor')) {
        extended = protoProps.constructor;
      } else {
        /* jshint evil: true */
        // Hack to apply arbitrary model name
        extended = new Function('p', 'return function ' + className + '(){return p.apply(this,arguments);}')(superclass);
      }

      // Add static properties to the constructor function, if supplied.
      _extendWithGetSet(extended, superclass, staticProps);

      // Set the prototype chain to inherit from `superclass`, without calling
      // `superclass` constructor function.
      extended.prototype = Object.create(superclass.prototype);

      // Add prototype properties (instance properties) to the subclass,
      // if supplied.
      if (protoProps) _extendWithGetSet(extended.prototype, protoProps);

      // Set a convenience property in case the superclass prototype is needed
      // later.
      extended.superclass = extended.prototype._superclass = superclass;
      extended.__super__  = extended.prototype._super = superclass.prototype;

      // Self-link class to be accessible from inside instance
      // (for static methods/props access)
      // extended.prototype._class = extended.prototype.constructor = extended;
      extended.prototype._class = extended;

      return extended;
    },

    // Internal helper to build model/collection classes based on definition
    extendModelClass: function (superClass, modelDefinition, modelNames) {

      /* Expected `modelDefinition` format:
       *
       * SuperClass.extend('blog', {
       *
       *   baseUrl: '/blogs',
       * 
       *   title: 'Some blog title',
       *   description: 'Some blog description',
       *   daysActive: 40,
       *   author: modelize.attr.model({ modelClass: 'user' }),
       *   posts: modelize.attr.collection({
       *     modelClass: 'blogPost',
       *     url: '/posts'
       *   }),
       *
       *   someModelMethod: function (someParam) {
       *     ...
       *   },
       *
       *   collection: {
       *     someCollectionMethod: function () {
       *       ...
       *     }
       *   },
       *
       *   static: {
       *     someStaticMethod: function () {
       *       ...
       *     }
       *   }
       * });
       */
      

      modelDefinition = modelDefinition || {};

      var modelDef        = _omitProps(modelDefinition, 'static', 'collection', 'baseUrl', 'urlPrefix'),
          modelDefaults   = {},
          collectionDef   = _.isObject(modelDefinition.collection) ? modelDefinition.collection : null,
          staticProps     = _.isObject(modelDefinition.static) ? modelDefinition.static : {},
          propertyInitializers = {},
          modelClassMeta  = {},
          modelName, collectionName, modelClassName;

      if (_.isArray(modelNames) && modelNames.length > 0) {
        modelName      = modelNames[0];
        collectionName = modelNames[1];
      } else if (_.isString(modelNames)) {
        modelName = modelNames;
      }

      if (!_.isString(modelName)) {
        _error('You have to provide the model name to define a new model');
      }

      if (modelClassCache.byModelName[modelName]) {
        _error('The model name should be unique. It seems that you already have the model with name "' + modelName + '"');
      }

      if (modelName && !collectionName) collectionName = stringHelper.pluralize(modelName);

      if (modelClassCache.byCollectionName[collectionName]) {
        _error('The collection name should be unique. It seems that you ' +
               'already have the model with collection name "' + collectionName + '"');
      }

      // Build model class/type

      modelClassName = modelName ? stringHelper.capitalize(modelName) : 'ExtendedModel';

      for (var key in modelDef) {
        if (_.isFunction(modelDef[key])) {
          // Is it some "special property" function that is defined with
          // .attr.model(...), .attr.collection(...), etc and 
          // should be mixed into model with function on instance
          // creation? Create a "property initializer" function for it then.
          if (modelDef[key].isPropertyInitializer) {
            // Let "initializerFn" function do its work when model created

            // Note: modelDef[key] is initializer function
            propertyInitializers[key] = modelDef[key];
            delete modelDef[key];
          }

          // Note: Other functions are considered methods
        } else {
          // Otherwise if its not accessor property or some system property,
          // take it right to `defaults` and delete from modelDefinition
          var propDesc = Object.getOwnPropertyDescriptor(modelDef, key);
          if (propDesc.get || propDesc.set) continue;

          // Others go to defaults
          modelDefaults[key] = modelDef[key];
          delete modelDef[key];
        }
      }


      // Everything else goes to model prototype.
      // Note: explicit get/set property accessors go
      // to prototype and are not included on serialization.
      // Hint: Use modelize.attr.computed(...) to define
      // some instance-level serializable property on model.
      var modelProto = _extendWithGetSet({}, modelDef);

      staticProps.urlPrefix = modelDefinition.urlPrefix || undefined;
      staticProps.baseUrl = modelDefinition.baseUrl || undefined;
      if (!staticProps.baseUrl) staticProps.baseUrl = urlHelper.asUrl(stringHelper.toDashCase(collectionName));



      var extendedModelClass = this.extendClass(superClass, modelProto, staticProps, modelClassName);

      // Merge defaults and propertyInitializers with those of a superclass
      modelClassMeta = {
        modelDefinition:      modelDefinition,
        modelName:            modelName,
        collectionName:       collectionName,
        superclass:           superClass,
        defaults:             _.extend({}, (superClass._modelClassMeta && superClass._modelClassMeta.defaults) || {}, modelDefaults),
        propertyInitializers: _.extend({}, (superClass._modelClassMeta && 
                                            superClass._modelClassMeta.propertyInitializers) || {}, propertyInitializers),
        collectionExtensions: {}
      };


      // Create the collectionExtensions for model class metadata
      // and pass all superclass collection stuff there too.
      // Note: We can't use extendCollection(...) method here
      // because it doesn't take superclass into account
      // and supposed to be used by app developer.
      if (superClass._modelClassMeta && _.isObject(superClass._modelClassMeta.collectionExtensions)) {
        modelClassMeta.collectionExtensions = _.extend({}, modelClassMeta.collectionExtensions,
          superClass._modelClassMeta.collectionExtensions);
      }

      if (collectionDef) {
        modelClassMeta.collectionExtensions = _.extend({}, modelClassMeta.collectionExtensions, collectionDef);
      }

      // Make modelClassMeta available from modelClass itself
      // and model prototype
      extendedModelClass._modelClassMeta = extendedModelClass.prototype._modelClassMeta = modelClassMeta;

      return extendedModelClass;
    },

    // Extends the collection for particular model class with
    // new properties.
    extendCollection: function (modelClass, collectionDefinition) {
      if (!modelClass || !modelClass._modelClassMeta || !collectionDefinition) return modelClass;
      
      modelClass._modelClassMeta.collectionExtensions = _.extend({},
        modelClass._modelClassMeta.collectionExtensions, collectionDefinition);

      return modelClass;
    }
  };


  // Utility helper that resolves a model type
  // given a resource name string
  var modelizeMetaResolver = {
    resolve: function (modelizer, options) {
      var parentModelized  = modelizer.parentModelized,
          isCollection     = modelizer.isCollection,
          resourceName     = modelizer.resourceName,
          parentModelClass = parentModelized ? parentModelized.modelClass : undefined;

      var modelized = {
        modelClass: null,
        modelInstanceOptions: { }
      };


      // Beware! Dragons ahead!
      //         .  .
      //      ,  |\/|  ,
      //      )\ (oo) /(
      //     /'.//_/|/.'\
      //    / ,@@/ w('_, \
      //   /'`   (WW)   `'\
      //  /    M )W) M     \
      //      '' (( ''
      //          ))
      //         /^^\

      // If resourceName provided is NOT recognized as URL,
      // first try to check parent model properties
      if (!urlHelper.isLikeUrl(modelizer.resourceName)) {
        if (parentModelClass && modelClassHelper.isModelClass(parentModelClass) &&
                                parentModelClass !== defaultModelClass) {

          // TODO: Think over and maybe obtain the `baseURL` and `urlPrefix` from model property definition too
          if ((isCollection && modelClassHelper.hasCollectionAttr(parentModelClass, resourceName)) ||
                               modelClassHelper.hasModelAttr()(parentModelClass, resourceName)) {
            var specialAttr = modelClassHelper.getSpecialAttrMeta(parentModelClass, resourceName);
            if(specialAttr) modelized.modelClass = specialAttr.modelClass;
          }

        }
      }

      // At this point, the resourceName is either URL or should be considered URL
      // since all else fails to match.
      // Note: We need to check against URLs before checking by model name
      // to allow for more complicated polymorhic scenarios.

      // Common URL resolution flow
      // ==========================
      // Consider we have:
      // 
      // defineModel('comment', {
      //   baseUrl: '/comments'
      // });
      //
      // defineModel('feedComment', {
      //   base: '/blog/posts/comments' // All comments feed
      // });
      // 
      // 1) Traverse bottom up, gather the meta about every "level" and see
      //    if every level up is either `isCollection` or with `resourceId === undefined`.
      //    Stop when there is a level where that pattern breaks
      // 2) Go top to bottom (from where we stopped at prev step) and check
      //    URLs starting from there:
      //    - modelize('blog').many('posts').many('comments')
      //      - check /blog/posts/comments, find 'feedComment' model immediately
      //    - modelize('blog').one('about').many('comments')
      //      - nothing at '/blog/about/comments', nothing at '/about/comments',
      //        check /comments, find 'comment' model
      //    - modelize('blog').one('posts', 123).many('comments')
      //      - stopped at .one('posts', 123), so only check '/comments', find 'comment'
      //

      // If no model yet, lets check some URLies
      if (!modelized.modelClass) {
        // Gather the data on what URLs to check

        var urlsToCheck = [],
            urlToCheck  = urlHelper.asUrl(resourceName);

        urlsToCheck.unshift(urlToCheck);

        // Go one "modelized" up and start collecting URLs to check
        var currentModelized = parentModelized;
        while (currentModelized) {
          // Break if not a collection, i.e., a model, that has an ID defined
          if (!currentModelized.isCollection && currentModelized.resourceId) break;

          // From here, assume that modelInstanceOptions has `baseUrl` set
          // anyway, despite custom modelClass might have its own `baseUrl`.
          // In case parent modelClass is custom and `baseUrl` is set for it,
          // that `baseUrl` is being copied to `modelInstanceOptions` anyway.
          var currentBaseUrl = currentModelized.modelInstanceOptions.baseUrl;
          if (currentBaseUrl) {
            urlToCheck = urlHelper.combineUrls(currentBaseUrl, urlToCheck);
            urlsToCheck.unshift(urlToCheck);
          }

          var currentUrlPrefix = currentModelized.modelInstanceOptions.urlPrefix;

          // If no urlPrefix on current "modelized" is set, then there are
          // no more URLs to check even if there is another "modelized" level up,
          // so just break here. Basically put, this means that the current
          // "modelized" `baseUrl` already contains the leftmost part
          // of full URL we need to check, so we're complete.
          if (!currentUrlPrefix) break;

          currentModelized = currentModelized.parentModelized;

          // Another corner case - no more parent "modelizeds" but
          // urlPrefix is left, so we have one more thing to check
          if (!currentModelized && currentUrlPrefix) {
            urlsToCheck.unshift(urlHelper.combineUrls(currentUrlPrefix, urlToCheck));
          }
        }

        // Check URLs if there is something in `modelClassCache` hash
        // Note: They are sorted from most specific (longest)
        // to most generic (shortest)
        for (var i = 0; i < urlsToCheck.length; i++) {
          modelized.modelClass = modelClassCache.byBaseUrl[urlsToCheck[i]];
          if (modelized.modelClass) break;
        }
      }

      // If URL checks failed, we also try to check the model by its name
      // Only if not like URL again
      if (!modelized.modelClass && !urlHelper.isLikeUrl(resourceName)) {
        // Check modelClassCache by model name no matter if this `isCollection` or not
        if (modelClassCache.byModelName[resourceName]) {
          modelized.modelClass = modelClassCache.byModelName[resourceName];
        }

        // For isCollection, also check "collection name" (plural model name)
        if (isCollection && modelClassCache.byCollectionName[resourceName]) {
          modelized.modelClass = modelClassCache.byCollectionName[resourceName];
        }
      }

      // No modelClass so far? No custom class is defined then, fallback to default
      if (!modelized.modelClass) modelized.modelClass = defaultModelClass;


      // By this time, modelClass is resolved to either some custom
      // class or default model class.

      // Base URL for model first
      modelized.modelInstanceOptions.baseUrl = modelized.modelClass.baseUrl ||
                                               urlHelper.asUrl(resourceName);

      // Then URL prefix
      var urlPrefix = '';
      if (parentModelized) {
        var parentUrl = parentModelized.modelInstanceOptions.baseUrl;

        // Special case - it is not a collection (i.e., it is a model) and there is
        // a resourceId (which means, its not a singleton).
        // We need to build a RESTful URL in this case
        if (!parentModelized.isCollection && parentModelized.resourceId) {
          parentUrl = urlHelper.buildRestfulUrl(parentUrl, false, parentModelized.resourceId);
        }

        // For all cases: just append parent baseUrl to its urlPrefix
        urlPrefix = urlHelper.combineUrls(parentModelized.modelInstanceOptions.urlPrefix, parentUrl);
      }

      if (urlPrefix) {
        // Corner case handling:
        // Make sure urlPrefix only contains the part that is NOT in our baseUrl yet
        // because some overlapping is possible, for example:
        // - We have `feedComment` model and its baseUrl is like `/blog/posts/comments`
        //   (all `comments` feed without taking care about particular `post`)
        // 
        // - We then "modelize" like `modelize.one('blog').many('posts').many('comments')`
        // 
        // - In this case, at point we handle `comments` part, we have parent with
        //     {
        //       urlPrefix: '/blog',
        //       baseUrl:   '/posts'
        //     }
        //     
        //   which makes our model resolved here look like
        //     {
        //       urlPrefix: `/blog/posts`
        //       baseUrl:   `/blog/posts/comments`
        //     }
        //
        //   This will finally lead to a resource URL that looks like:
        //   `/blog/posts/blog/posts/comments` which is 99.9% of the time
        //   is NOT what you want. Hence the need to cut the overlapping part
        //   out of `urlPrefix`.
        //   
        //   urlHelper.stripOverlap(...) implements that

        modelized.modelInstanceOptions.urlPrefix = urlHelper.stripOverlap(urlPrefix, modelized.modelInstanceOptions.baseUrl);
      }

      // Set parentModelized itself so that it can be reused by something else
      if (parentModelized) modelized.parentModelized = parentModelized;

      return modelized;
    }
  };


  // The list of reserved internal properties
  // that are "non-attributes" and should be excluded
  // from model when getting its attributes (workaround
  // to allow model attributes on a model directly
  // side by side with system/internal properties).
  var _reservedProperties = [
    '$$hashKey',
    '$iid',
    '_modelClassMeta',
    '_collections',
    '_remoteState',
    '_loadingTracker',
    '_initOptions',
    'idAttribute',
    'baseUrl',
    'urlPrefix',
    '$modelErrors',
    '$error',
    '$valid',
    '$invalid',
    '$loading',
    '$selected',
    '$destroyed'
  ];

  // TODO: Think how to combine with _extendWithGetSet
  var _extendModelAttrs = function (dst) {
    dst = dst || {};
    angular.forEach(arguments, function (obj) {
      if (obj !== dst && _.isObject(obj)) {
        for (var key in obj) {
          var propertyDescriptor = Object.getOwnPropertyDescriptor(obj, key);

          // If we encounter a getter function,
          if (propertyDescriptor && (propertyDescriptor.get || propertyDescriptor.set)) {
            // Manually copy the definition across rather than doing a regular copy, as the latter
            // approach would result in the getter function being evaluated. Need to make it
            // enumerable so subsequent mixins pass through the getter.
            var getter = propertyDescriptor.get || undefined,
                setter = propertyDescriptor.set || undefined;

            Object.defineProperty(
              dst, key, { get: getter, set: setter, enumerable: true, configurable: true }
            );
          } else if (obj[key] && _.isObject(obj[key]) && (obj[key] instanceof defaultModelClass || obj[key].$isCollection)) {
            // Copy models and collections by reference
            dst[key] = obj[key];
          } else {
            // Otherwise, just do a full clone
            dst[key] = _deepClone(obj[key], _extendModelAttrs);
          }
        }
      }
    });

    return dst;
  };


  // Internal helper to run "property initializers"
  // for complex properties like nested models,
  // collections, etc that need special approach
  // to "set" them.
  var _runPropertyInitializers = function (model) {
    if (!model._modelClassMeta || !model._modelClassMeta.propertyInitializers) return;

    var propsToInitialize = Object.getOwnPropertyNames(model._modelClassMeta.propertyInitializers);

    for (var i = 0; i < propsToInitialize.length; i++) {
      var prop   = propsToInitialize[i],
          initFn = model._modelClassMeta.propertyInitializers[prop];
      
      initFn(model, prop);
    }
  };



  // Enough internal stuff. Enter Modelizer.

  return angular.module('angular-modelizer', [])

    .provider('modelize', function () {

      var _provider = this;

      // Configurable stuff
      this.parseModelErrors = function (responseData, options) {
        if (!responseData || !responseData.fieldErrors || !_.isArray(responseData.fieldErrors)) return null;

        var errors = {};
        responseData.fieldErrors.forEach(function (fieldError) {
          var attrName = fieldError.field,
              message  = fieldError.message;

          if (!_.isArray(errors[attrName])) errors[attrName] = [];
          errors[attrName].push(message);
        });

        return errors;
      };



      // 'modelize' factory itself

      this.$get = ['$q', '$http', function ($q, $http) {

        // Minimalistic promise tracker implementation
        // similar to https://github.com/ajoslin/angular-promise-tracker
        // but with a bit cut functionality.
        // Needed to assist models/collections `$loading`
        // state tracking.
        var PromiseTracker = function () {
          if (!(this instanceof PromiseTracker)) {
            return new PromiseTracker();
          }

          var _this   = this,
              tracked = [];

          this.active = function () {
            return tracked.length > 0;
          };

          this.destroy = this.cancel = function () {
            for (var i = tracked.length - 1; i >= 0; i--) {
              tracked[i].resolve();
            }

            tracked.length = 0;
          };

          this.createPromise = function () {
            var deferred = $q.defer();
            tracked.push(deferred);

            deferred.promise.finally(function() {
              tracked.splice(tracked.indexOf(deferred), 1);
            });

            return deferred;
          };

          this.addPromise = function (promise) {
            if (!promise.then) {
              throw new Error('promiseTracker#addPromise expects a promise object!');
            }

            var deferred = _this.createPromise();

            // When given promise is done, resolve our created promise
            promise.then(function success(value) {
              deferred.resolve(value);
              return value;
            }, function error(value) {
              deferred.reject(value);
              return $q.reject(value);
            });

            return deferred;
          };
        };

        // Promise extensions helper.
        var promiseHelper = {
          // Extends modelizer promises with $future property
          // that can be accessed immediately. The value for it
          // is supplied later, when promise is fulfilled.
          setFuture: function (promise, futureObject) {
            promise.$future = futureObject;
            return promise;
          }
        };

        // HTTP Request helper. Thin wrapper around Angular $http
        // service. Exposed on both Model class and its prototype
        // as $request property for convenience.
        // Can be invoked on its own as well as using one of its
        // convenience methods (similar to $http).
        var $request = function (options) {
          options = options || {};

          var method = options.method || '',
              url    = options.url,
              data   = options.data || undefined,
              fullResponse = !!options.fullResponse;

          var deferred = $q.defer();

          // Note: Angular supports transformRequest parameter for
          // its $http config. We don't mix it with our model-level
          // `options.parse` concept despite they can be somewhat
          // interchanged and serve the same purpose.
          var _future = {};
          $http(_.extend({}, options, { method: method.toUpperCase(), url: url, data: data })).then(function (response) {
            _future = fullResponse ? response : response.data;
            deferred.resolve(_future);
          }, function (response) {
            deferred.reject(response);
          });

          deferred.promise = promiseHelper.setFuture(deferred.promise, _future);

          return deferred.promise;
        };

        _.extend($request, {
          setUrlParams: urlHelper.setUrlParams,

          get: function (url, options) {
            return $request(_.extend({}, options, { method: 'GET', url: url }));
          },

          post: function (url, data, options) {
            return $request(_.extend({}, options, { method: 'POST', url: url, data: data }));
          },

          put: function (url, data, options) {
            return $request(_.extend({}, options, { method: 'PUT', url: url, data: data }));
          },

          patch: function (url, data, options) {
            return $request(_.extend({}, options, { method: 'PATCH', url: url, data: data }));
          },

          delete: function (url, options) {
            return $request(_.extend({}, options, { method: 'DELETE', url: url }));
          },

          head: function (url, options) {
            return $request(_.extend({}, options, { method: 'HEAD', url: url }));
          }
        });


        var modelModelizerMethods, collectionModelizerMethods;

        // "modelizer" itself is a helper utility that assists with
        // URL building (via urlBuilder) and helps with correct
        // model metadata resolution based on given resource names
        // (via modelizeMetaResolver). This is what exposes all the
        // public API for "modelizing". Pretty handful thighy!
        var Modelizer = function (resourceName, resourceId, isCollection, parentModelized, options) {
          options              = _.clone(options) || {};
          this.resourceName    = resourceName;
          this.resourceId      = resourceId;
          this.isCollection    = isCollection;
          this.parentModelized = parentModelized;
          this.modelized       = modelizeMetaResolver.resolve(this, options);

          _.extend(this, isCollection ? collectionModelizerMethods : modelModelizerMethods);
        };

        var coreModelizerMethods = {
          one: function (resourceName, resourceId, options) {
            return new Modelizer(resourceName, resourceId, false, this.modelized, options);
          },

          many: function (resourceName, options) {
            return new Modelizer(resourceName, null, true, this.modelized, options);
          }
        };

        var sharedModelizerMethods = {

          get $modelClass () {
            return this.modelized.modelClass;
          },

          $new: function (attrs, options) {
            attrs = attrs || {};

            if (!this.isCollection && this.resourceId) {
              attrs[this.modelized.modelClass.prototype.idAttribute] = this.resourceId;
            }

            return this.modelized.modelClass.$new(attrs, _.extend({}, this.modelized.modelInstanceOptions, options));
          },

          $newCollection: function (models, options) {
            return this.modelized.modelClass.$newCollection(models, _.extend({}, this.modelized.modelInstanceOptions, options));
          }

        };

        _extendWithGetSet(Modelizer.prototype, coreModelizerMethods, sharedModelizerMethods);


        // "model" modelizer methods. Will be mixed into generic
        // modelizer that "modelizes" the resource representing
        // a single object
        modelModelizerMethods = {
          get: function (options) {
            options = options || {};
            if (options.updateRemoteState !== false) options.updateRemoteState = true;
            return this.$new({}, _.extend({}, this.modelized.modelInstanceOptions, options)).fetch(options);
          },

          save: function (attrs, options) {
            options = options || {};
            if (options.updateRemoteState !== false) options.updateRemoteState = true;
            return this.$new(attrs, _.extend({}, this.modelized.modelInstanceOptions, options)).save(options);
          },

          destroy: function (options) {
            return this.$new({}, _.extend({}, this.modelized.modelInstanceOptions, options)).$destroy(options);
          }
        };

        // "collection" modelizer methods. Will be mixed into generic
        // modelizer that "modelizes" the resource representing
        // a collection of objects
        collectionModelizerMethods = {
          get: function (id, options) {
            return this.modelized.modelClass.get(id, _.extend({}, this.modelized.modelInstanceOptions, options));
          },

          all: function (options) {
            return this.modelized.modelClass.all(_.extend({}, this.modelized.modelInstanceOptions, options));
          },

          query: function (query, options) {
            return this.modelized.modelClass.query(query, _.extend({}, this.modelized.modelInstanceOptions, options));
          },

          create: function (model, options) {
            if (!model && !_.isObject(model)) return $q.reject(false);
            options = options ? _.clone(options) : {};

            if (options.updateRemoteState !== false) options.updateRemoteState = true;

            if (!(model instanceof defaultModelClass)) {
              model = this.modelized.modelClass.$new(model, _.extend({}, this.modelized.modelInstanceOptions, options));
            }

            var promise = model.save(null, options);
            return promiseHelper.setFuture(promise, model);
          },

          destroy: function (id, options) {
            options = options ? _.clone(options) : {};

            var url = options.url;
            if (this.modelized.modelClass.baseUrl) {
              url = urlHelper.setUrlParams(urlHelper.appendIdParam(this.modelized.modelClass.baseUrl, id, true), {});
            }

            if (!url) _error('URL error: "baseUrl" should be defined on "modelized" model class or ' +
                             '"options.url" provided to "destroy" the model');

            return this.$request.delete(url, options).then(function () {
              return true;
            });
          }
        };


        // Base "Model" class
        
        var Model = function (attributes, options) {
          var attrs = attributes || {};
          options = options ? _.clone(options) : {};

          this._initOptions = options;

          // Setting unique instance ID
          this.$iid = _.uniqueId('model_');

          if (options.parse) attrs = this.parse(attrs, options) || {};
          attrs = _extendModelAttrs({}, (this._modelClassMeta && this._modelClassMeta.defaults) || {}, attrs);

          // Ensure all "complex" properties/accessors are set
          _runPropertyInitializers(this);

          this.set(attrs);

          // Init special properties

          // The set of collections that current model is in.
          // Useful for notifications, etc
          this._collections = {};

          // Last known remote (server) state of a model.
          // Useful to `diff` it to perform optimal `patch`.
          this._remoteState = null;

          // Property that contains all model-level errors
          // keyed by attribute name and values representing
          // arrays of error messages.
          this.$modelErrors = null;

          // Handling URLs
          this.baseUrl = options.baseUrl || this.baseUrl || this._class.baseUrl;
          this.urlPrefix = options.urlPrefix || this.urlPrefix || this._class.urlPrefix;

          // Init $loading state tracker
          this._loadingTracker = new PromiseTracker();

          // Invoke overridable "construction" function
          this.initialize.apply(this, arguments);

          // Set remote state on initialization if options say to do so
          if (options.updateRemoteState) this._setRemoteState();
        };

        // Model instance methods and properties

        _extendWithGetSet(Model.prototype, {

          _class: Model,

          // Properties

          // Convenience wrappers around `isValid`.
          // Can be easily used on UI side.
          // Note: its not complete replacement for `isValid`
          // because the latter is to allow overrides.
          get $valid () {
            return this.isValid();
          },

          get $invalid () {
            return !this.isValid();
          },

          get $loading () {
            return this._loadingTracker && this._loadingTracker.active();
          },

          // Override this to set whatever attribute you
          // want to represent the `id` of the model instance.
          idAttribute: 'id',

          // Methods

          // Empty by default, can be overridden to perform
          // some initialization tasks for custom models.
          initialize: function () { },

          // Get the resource URL for this model
          resourceUrl: function () {
            if (!this.baseUrl) return null;

            if (!this.idAttribute || this.isNew()) {
              return urlHelper.setUrlParams(urlHelper.combineUrls(this.urlPrefix, this.baseUrl), this);
            }

            return urlHelper.setUrlParams(urlHelper.combineUrls(this.urlPrefix, urlHelper.appendIdParam(this.baseUrl, this.idAttribute)), this);
          },

          // Set a hash of model attributes on the object.
          // Use this to perform bulk attribute updates.
          set: function (attrs, options) {
            attrs = attrs ? (attrs instanceof Model ? attrs.getAttributes() : _.clone(attrs)) : {};
            options = options || {};

            _.extend(this, attrs);

            return this;
          },

          clear: function (options) {
            for (var key in this.getAttributes(options)) this[key] = undefined;
          },

          // Fetch the model data from the server. If the server's
          // state of the model is different from its current,
          // attributes will be overwritten and _remoteState
          // will be updated accordingly.
          fetch: function (options) {
            if (this.$destroyed) return promiseHelper.setFuture($q.reject(this), this);

            var _this = this,
                url   = this.resourceUrl();

            options = options ? _.clone(options) : {};
            if (options.parse === undefined) options.parse = true;

            if (!url) _error('URL error: "baseUrl" should be defined or "options.url" specified to "fetch" the model');

            // TODO: This might need fixes and simplification
            var promise = this.$request.get(url, options).then(function (resData) {
              var _resData = options.fullResponse ? resData.data : resData,
                  data     = options.parse ? _this.parse(_resData, options) : _resData;
              
              _this.set(data, options);
              _this._setRemoteState(null, options);

              return _this;
            }, function (reason) {
              $q.reject(reason);
            });

            if (this._loadingTracker) this._loadingTracker.addPromise(promise);
            return promiseHelper.setFuture(promise, this);
          },

          // Save the current model to the server.
          // Performs either `POST`, `PUT` or `PATCH` update
          // based on model state and provided options.
          // Pass `patch: true` option to force a partial update
          // (changed attributes only). This option only works
          // when model is not `isNew()`.
          save: function (options) {
            if (this.$destroyed) return promiseHelper.setFuture($q.reject(this), this);

            options = _.extend({}, options);

            var _this = this,
                url;

            var method = this.isNew() ? 'post' : (options.patch ? 'patch' : 'put');

            if (options.url) {
              url = options.url;
            } else {
              switch (method) {
                case 'post':
                  url = this.baseUrl ? urlHelper.combineUrls(this.urlPrefix, this.baseUrl) : null;
                  if (!url) _error('URL error: "baseUrl" should be defined or "options.url" specified to "save:create"');
                  break;
                case 'patch':
                case 'put':
                  url = this.resourceUrl();
                  if (!url) _error('URL error: "baseUrl" should be defined or "options.url" specified to "save:update"');
                  break;
              }
            }

            var reqOptions = _.extend({ method: method, url: url }, options);
            reqOptions.data = method === 'patch' ?
              this.serialize({ changedOnly: true }) :
              this.serialize();

            if (this.transformOnSave && _.isFunction(this.transformOnSave)) {
              reqOptions.data = this.transformOnSave(reqOptions.data, options);
            }

            var promise = this.$request(reqOptions).then(function (resData) {
              // Only update the model if object is returned
              if (resData && _.isObject(resData)) {
                var serverAttrs = _this.parse(resData, options);
                _this.set(serverAttrs);
              }

              _this._setRemoteState(null, options);

              return _this;
            }).catch(function (response) {
              if (response.status === 422 && response.data && _this.parseModelErrors) {
                _this.clearModelErrors();
                _this.addModelErrors(_this.parseModelErrors(response.data));
              }

              return $q.reject(response);
            });

            if (this._loadingTracker) this._loadingTracker.addPromise(promise);
            return promiseHelper.setFuture(promise, this);
          },

          // Destroy this model on the server if it was ever persisted.
          // Optimistically removes the model from its collections, if there are any.
          // Provide `wait: true` as option to make it wait for server to
          // respond with success before removing from referenced collections.
          // Provide `keepInCollections: true` to prevent deleting model from
          // collections (might be useful for "undo" scenarios)
          destroy: function (options) {
            if (this.$destroyed) return promiseHelper.setFuture($q.reject(this), this);

            options = options ? _.clone(options) : {};
            var _this = this;

            var removeFromCollections = function () {
              if (_this._collections) {
                for (var key in _this._collections) {
                  _this._collections[key].remove(_this);
                  delete _this._collections[key];
                }
              }

              _this._collections = null;
            };

            if (this.isNew()) {
              if (!options.keepInCollections) removeFromCollections();
              return $q.when(false);
            }

            if (!options.wait && !options.keepInCollections) removeFromCollections();

            var url = options.url || this.resourceUrl();
            if (!url) _error('URL error: "baseUrl" should be defined or "options.url" specified to "destroy" the model');

            var promise = this.$request.delete(url, options).then(function () {
              if (options.wait && !options.keepInCollections) removeFromCollections();
              _this.$destroyed = true;

              return _this;
            });

            if (this._loadingTracker) this._loadingTracker.addPromise(promise);
            return promiseHelper.setFuture(promise, this);
          },

          // Get a flattened object containing all the actual
          // attributes values (including getters and computed
          // properties). Useful for JSON serialization.
          // Provide `includeComputed: true` to also include
          // computed properties (either explicitly defined as "computed"
          // or those having getters only) into resulting object.
          getAttributes: function (options) {
            var model     = this,
                attrs     = {};

            // Dropping some system properties that might present on instance
            var propNames = _.difference(Object.getOwnPropertyNames(model), _reservedProperties);

            options = options || {};

            for (var i = 0; i < propNames.length; i++) {
              var propDesc = Object.getOwnPropertyDescriptor(model, propNames[i]);
              
              // Properties that cannot be set are considered "computed"
              // and there is special options param to handle this
              // and if that is falsy - skip the property.
              // Setter-only properties are not included in any case.
              if (propDesc &&
                  ((propDesc.get && !propDesc.set && !options.includeComputed) ||
                   (propDesc.set && !propDesc.get))) continue;

              attrs[propNames[i]] = model[propNames[i]];
            }

            return attrs;
          },

          // Helper method to "serialize" a model.
          // Serialization in this case results in the object that
          // is ready to get "stringified" to JSON directly. It does so
          // bt flattening of all properties, including nested models
          // and collections.
          // Note: This method doesn't transform model to JSON,
          // use `toJSON` method for that purpose.
          serialize: function (options) {
            options = options || {};

            var modelAttrs = options.changedOnly ?
              this.getChangedAttributes(options) :
              this.getAttributes(options);

            // Leave basic properties and objects arrays as is
            // and appropriately handle nested models and
            // collections serialization.
            for (var attrName in modelAttrs) {
              var attr = modelAttrs[attrName];
              if (attr && (attr instanceof Model || attr.$isCollection) && attr.serialize) {
                modelAttrs[attrName] = attr.serialize(_.extend({}, options, { changedOnly: false }));
              }
            }

            return modelAttrs;
          },

          toJSON: function (options) {
            return angular.toJson(this.serialize(options));
          },

          parse: function (responseData, options) {
            return responseData;
          },

          // Parses the 422 response containing model errors
          // into an object that contains keys named
          // after model attributes and values are error message
          // arrays.
          // Ex: 
          //   {
          //     someAttr:  ['Some attr is invalid', 'Some attr has wrong format'],
          //     otherAttr: ['Other attr is invalid']
          //   }
          parseModelErrors: function (responseData, options) {
            return _provider.parseModelErrors(responseData, options);
          },

          clone: function (options) {
            return this._class.$new(this.getAttributes(options), _.extend({}, this._initOptions, options));
          },

          // Take a list of differences between current and other
          // model. Useful to check the difference between
          // model attributes when it was loaded from server
          // and current attributes (e.g., in `patch` scenarios).
          diff: function (attrs, options) {
            var diff = {},
                thisAttrs = this.getAttributes(options);

            for (var attr in attrs) {
              var val = attrs[attr],
                  isModel = thisAttrs[attr] instanceof Model,
                  idAttribute = thisAttrs[attr].idAttribute,
                  isCollection = thisAttrs[attr] && thisAttrs[attr].$isCollection,
                  isDifferent = false;

              // Note: Since we keep models in serialized state, we need to compare
              // model properties and models inside collection properties by model
              // ids (or whatever is set as `idAttribute`)

              if (isModel) {
                if (!val || thisAttrs[attr][idAttribute] !== val[idAttribute]) isDifferent = true;
              } else if (isCollection) {
                if (!val || val.length !== thisAttrs[attr].length) {
                  isDifferent = true;
                } else {
                  // Lengths are the same if we get here so we can just check
                  // if every element of one array is in another. In case at least
                  // one isn't - they're immediately considered different.
                  var colAttr = thisAttrs[attr];

                  // Note: Changed order considered "difference" too
                  for (var i = 0; i < colAttr.length; i++) {
                    if (val[i][idAttribute] !== colAttr[i][idAttribute]) {
                      isDifferent = true;
                      break;
                    }
                  }

                }
              } else if (!_.isEqual(thisAttrs[attr], val)) {
                isDifferent = true;
              }

              if (isDifferent) diff[attr] = { currentValue: thisAttrs[attr], comparedValue: val };
            }

            return diff;
          },

          getChangedAttributes: function () {
            var attrs = {};

            if (this._remoteState) {
              var diff = this.diff(this._remoteState);
              for (var attr in diff) {
                attrs[attr] = diff[attr].currentValue;
              }
            }

            return attrs;
          },

          isNew: function () {
            return !this[this.idAttribute];
          },

          isValid: function(options) {
            return !this.$modelErrors;
          },

          addModelError: function (attrName, message) {
            if (!attrName || !message || !(_.isString(message) || _.isArray(message))) return;

            var messages = _.isArray(message) ? message : [message];

            if (!this.$modelErrors) this.$modelErrors = {};

            if (this.$modelErrors[attrName] && _.isArray(this.$modelErrors[attrName])) {
              this.$modelErrors.concat(messages);
            } else {
              this.$modelErrors[attrName] = messages;
            }
          },

          clearModelError: function (attrName, options) {
            options = options || {};

            if (!attrName || !this.$modelErrors[attrName]) return;

            // Only remove first in case there are multiple errors
            // for the same attribute?
            if (options.firstOnly && _.isArray(this.$modelErrors[attrName]) &&
                this.$modelErrors[attrName].length > 1) {
              this.$modelErrors[attrName].shift();
            } else {
              delete this.$modelErrors[attrName];
            }
          },

          addModelErrors: function (errorsObj) {
            if (!errorsObj) return;

            for (var prop in errorsObj) {
              if (!this.$modelErrors) this.$modelErrors = {};
              this.$modelErrors[prop] = errorsObj[prop];
            }
          },

          clearModelErrors: function () {
            this.$modelErrors = null;
          },

          _setRemoteState: function (attrs, options) {
            if (!attrs && attrs !== false) attrs = this.serialize(options);
            this._remoteState = attrs;
          }

        });


        // Collection mixin

        // A set of `collection` methods and properties
        // to be mixed into array on "collection initialization".
        // Think of it as of collection `prototype` had the collection
        // initialized with constructor function.
        // Note: internal `initCollection` function acts as
        // a constructor in this case.
        var collectionMixin = {

          // Properties

          // Included for convenience, shortcut to make
          // doing requests simple when implmenting custom methods.
          $request: $request,

          get $loading () {
            return this._loadingTracker && this._loadingTracker.active();
          },

          // Methods

          initialize: function () { },

          // Load a remote representation of this collection from server
          // and reset the collection with whatever will arrive.
          // If `reset: true` is in `options` then collection will be
          // completely reset (otherwise it will be merged in a smart way).
          fetch: function (options) {
            var _this = this;
            options = options ? _.clone(options) : {};
            if (options.parse === undefined) options.parse = true;

            var fullResponse = !!options.fullResponse,
                rawData      = !!options.rawData,
                url          = options.url;

            if (!url && this.modelClass.baseUrl) {
              url = urlHelper.combineUrls(this.modelClass.urlPrefix, this.modelClass.baseUrl);
            }
            
            var promise = this.$request.get(url, options).then(function (res) {
              var _resData = fullResponse ? res.data : res,
                  method  = options.reset ? 'reset' : 'set';

              _this[method](_resData, options);

              return rawData ? _resData : _this;
            });

            if (this._loadingTracker) this._loadingTracker.addPromise(promise);
            return promiseHelper.setFuture(promise, this);
          },

          // Get a model instance given either `id` or
          // model instance itself.
          get: function (obj, options) {
            if (!obj) return undefined;

            var id = this._modelId(obj);
            return this._idsIndex[obj] || this._idsIndex[id] || this._idsIndex[obj.$iid] || undefined;
          },

          where: function (attrs, firstOnly) {
            if (_.isEmpty(attrs)) return firstOnly ? undefined : [];
            var method = firstOnly ? 'find' : 'filter';

            // Using one of underscore/lodash methods
            return _[method](this.models, function(model) {
              for (var key in attrs) {
                if (attrs[key] !== model[key]) return false;
              }

              return true;
            });
          },

          any: function (attrs) {
            return attrs ? this.where(attrs).length > 0 : this.models.length > 0;
          },

          filter: function (filterFn) {
            return _.filter(this.models, filterFn);
          },

          // Create a new instance of a model in this collection. 
          // By default, the model is being added to the collection immediately,
          // pass `wait: true` option to make it wait for server successful
          // response first.
          // Returns the promise that is resolved with model as argument in case
          // of successful model `save`.
          create: function(model, options) {
            options = options ? _.clone(options) : {};
            options.updateRemoteState = true;

            if (!(model = this._prepareModel(model, options))) return $q.reject(false);
            if (!options.wait) this.add(model, options);

            var _this = this;

            var savePromise = model.save(null, options);
            savePromise.then(function () {
              if (options.wait) _this.add(model, options);
            });

            return promiseHelper.setFuture(savePromise, this);
          },

          add: function (models, options) {
            return this.set(models, _.extend({ merge: false }, options, { add: true, remove: false }));
          },

          // Remove a model or a set of models from collection.
          // Note: this method doesn't touch the server representation
          // of models (so, no `DELETE`) and only removes it from
          // collection itself.
          remove: function (models, options) {
            var isSingle = !_.isArray(models);
            options = options || {};
            models = isSingle ? [models] : _.clone(models);

            for (var i = 0, length = models.length; i < length; i++) {
              var model = models[i] = this.get(models[i]);
              if (!model) continue;

              var id = this._modelId(model);
              if (id !== null) delete this._idsIndex[id];
              delete this._idsIndex[model.$iid];

              var index = _.indexOf(this.models, model);
              this.models.splice(index, 1);

              this._removeModelReference(model, options);
            }

            return isSingle ? models[0] : models;
          },

          // Overriding core `Array` modification methods.

          // Add a model to the end of the collection.
          push: function (model, options) {
            return this.add(model, _.extend({ at: this.length }, options));
          },

          // Remove a model from the end of the collection.
          pop: function (options) {
            var model = this.models[this.length - 1];
            this.remove(model, options);

            return model;
          },

          // Add a model to the beginning of the collection.
          unshift: function (model, options) {
            return this.add(model, _.extend({ at: 0 }, options));
          },

          // Remove a model from the beginning of the collection.
          shift: function (options) {
            var model = this.models[0];
            this.remove(model, options);

            return model;
          },

          // Slice out a sub-array of models from the collection.
          slice: function () {
            return Array.prototype.slice.apply(this.models, arguments);
          },

          // Depending on provided options (`add`, `merge`, `remove` - all `true`
          // by default) adds new models that don't yet exist in the collection
          // (`add` option), merges or overwrites existing ones (`merge` option) and
          // removes nonexistent ones (`remove` option).
          // Pretty useful for entire collection update in one pass
          // and with high flexibility.
          set: function(models, options) {
            options = _.extend({}, { add: true, remove: true, merge: true }, options);
            if (options.parse) models = this.parse(models, options);
            if (options.updateRemoteState !== false) options.updateRemoteState = true;

            if (!_.isArray(models) && !_.isObject(models)) return models;

            var isSingle = !_.isArray(models);
            models = isSingle ? (models ? [models] : []) : models.slice();

            var add = options.add,
                merge = options.merge,
                remove = options.remove;

            var attrs, model, id, existing,
                at = options.at,
                toAdd = [], toRemove = [], modelMap = {};

            var i, length;

            for (i = 0, length = models.length; i < length; i++) {
              attrs = models[i];
              if (!_.isObject(attrs)) continue;

              // Handle duplicates: either merge it or prevent from being
              // added based on provided `options`
              existing = this.get(attrs);
              if (existing) {
                if (remove) modelMap[existing.$iid] = true;
                if (merge && attrs !== existing) {
                  attrs = this._isModel(attrs) ? attrs.getAttributes() : attrs;
                  if (options.parse) attrs = existing.parse(attrs, options);

                  existing.set(attrs, options);
                }

                models[i] = existing;
              } else if (add) {
                // New models go to `toAdd` array
                model = models[i] = this._prepareModel(attrs, options);
                if (!model) continue;
                toAdd.push(model);
                this._addModelReference(model, options);
              }

              // Prevent adding duplicates to collection
              model = existing || model;
              if (!model) continue;
              id = this._modelId(model);
              modelMap[id] = true;
            }

            // Remove nonexistent models if `options` say do that
            if (remove) {
              for (i = 0, length = this.models.length; i < length; i++) {
                if (!modelMap[(model = this.models[i]).$iid]) toRemove.push(model);
              }

              if (toRemove.length) this.remove(toRemove, options);
            }

            // Check if there is anything to add and splice in
            // new models at the correct index.
            if (toAdd.length) {
              if (!at) at = 0;
              for (i = 0, length = toAdd.length; i < length; i++) {
                this.models.splice(at + i, 0, toAdd[i]);
              }
            }

            // And finally return either models array or a single model depending
            // on what was given as argument
            return isSingle ? models[0] : models;
          },

          // Reset the entire collection with the new list
          // of models. Useful for bulk updates.
          reset: function (models, options) {
            options = options || {};
            for (var i = 0, length = this.models.length; i < length; i++) {
              this._removeModelReference(this.models[i], options);
            }

            this._reset();
            if (models && models.length) this.add(models, options);

            return this;
          },

          _reset: function () {
            this.models.length = 0;

            // TODO: Need to ensure the reference to this collection is
            // gone for all models that have been in here.
            // It is possible that despite we empty `models` property
            // those models could be contained by other collections
            // and still keep references to this collection in their
            // `_collections` properties.
            // That will expose a memory leak.
            this._idsIndex = {};
          },

          // Prepares a model instance to be added to this collection
          _prepareModel: function(attrs, options) {
            if (this._isModel(attrs)) return attrs;

            var model = new this.modelClass(attrs, options);

            // TODO: Think if its needed here or could we allow
            // setting invalid models on collection?
            // if (model.$modelErrors) return false;

            return model;
          },

          // Checks whether the object is a `Model` or
          // just an anonymous object with attributes.
          _isModel: function (obj) {
            return obj instanceof Model;
          },

          _modelId: function (attrs) {
            return attrs[this.modelClass.prototype.idAttribute || 'id'];
          },

          // Internal helper to reference this collection from model
          _addModelReference: function (model, options) {
            if (!this._isModel(model) || !model.$iid) return;

            // Store model under unique `model_345`-like key
            this._idsIndex[model.$iid] = model;

            // As well as under regular `id` or whatever is `idAttribute`
            var id = this._modelId(model);
            if (id) this._idsIndex[id] = model;

            // Set reverse reference (model referencing collection)
            model._collections = model._collections || {};
            model._collections[this.$iid] = this;
          },

          // Internal helper to remove the reference to this collection
          // from model
          _removeModelReference: function (model, options) {
            if (!this._isModel(model)) return;
            
            delete this._idsIndex[model.$iid];

            var modelId = this._modelId(model);
            if (modelId) delete this._idsIndex[modelId];
            
            // Remove reverse reference (model referencing collection)
            if (model._collections && model._collections[this.$iid]) delete model._collections[this.$iid];
          },

          serialize: function (options) {
            return _.map(this.models, function (model) { return model.serialize(options); });
          },

          toJSON: function (options) {
            return angular.toJson(this.serialize(options));
          },

          parse: function (responseData, options) {
            return responseData;
          },

          clone: function () {
            return this.modelClass.$newCollection(this.models);
          }

        };


        // Collection initializer (like contructor function)

        // Uses "mixin" composition approach because we want
        // our collection be a real `Array` and not Array-like object.
        var initCollection = function (models, options) {
          options = options || {};
          var modelClass = options.modelClass || defaultModelClass;

          // We want collection to be a native `Array` so that it behaves
          // as a real array. So we just make it an array explicitly.
          var collection = [];

          // Mix the `collectionMixin` into our array thus making it
          // a `collection` with rich functionality. `$request` included
          // too for convenience.
          _extendWithGetSet(collection, collectionMixin);

          // Mixin additional stuff is model class provides that
          if (modelClass._modelClassMeta && _.isObject(modelClass._modelClassMeta.collectionExtensions)) {
            _.extend(collection, modelClass._modelClassMeta.collectionExtensions);
          }

          collection.$iid = _.uniqueId('collection_');
          collection.modelClass = modelClass;
          collection.baseUrl = _.extend({}, collection.modelClass.baseUrl, options.baseUrl);

          // Mark collection with special property to
          // distinct it from regular `Array`
          collection.$isCollection = true;

          // Init $loading state tracker
          collection._loadingTracker = new PromiseTracker();

          // Note: `collectionMixin` methods work on `this.models`
          // property internally instead of just `this` to allow that
          // `models` property be anything. This allows `collectionMixin`
          // methods be mixed into any object that maintains `models` property
          // and that is not necessarily is an `Array`.
          // Looking forward to cleaner `Array` subclassing in some future JS.
          collection.models = collection;

          collection._reset();
          collection.initialize.apply(collection, arguments);

          if (models) {
            collection.reset(models, options);
          }

          return collection;
        };


        // Static / stateless methods on Model

        _.extend(Model, {

          extend: function (modelName, modelDefinition) {
            // Support for both .extend('myModelName', { ... }) and .extend({ ... })
            // Note: modelName can also be an array with both
            // model name and collection name
            if (_.isObject(modelName) && !_.isArray(modelName)) {
              modelDefinition = modelName;
              modelName = null;
            }

            var extendedModelClass = modelClassHelper.extendModelClass(this, modelDefinition, modelName);

            // Add class to registry/cache for later lookups
            // Will be available for lookup by model name,
            // collection name and baseUrl.
            modelClassCache.addModelClass(extendedModelClass);

            return extendedModelClass;
          },

          extendCollection: function (collectionDefinition) {
            return modelClassHelper.extendCollection(this, collectionDefinition);
          },

          $new: function (attrs, options) {
            options = options ? _.clone(options) : {};
            return new this(attrs, options);
          },

          $newCollection: function (models, options) {
            options = options ? _.clone(options) : {};
            options = _.extend({}, { modelClass: this }, options);
            return initCollection(models, options);
          },

          get: function (id, options) {
            options = options || {};
            if (options.updateRemoteState !== false) options.updateRemoteState = true;

            var _this = this,
                url = options.url;

            if (!url) {
              var baseUrl   = options.baseUrl || this.baseUrl,
                  urlPrefix = options.urlPrefix || this.urlPrefix;

              if (baseUrl) {
                url = urlHelper.combineUrls(urlPrefix, urlHelper.appendIdParam(baseUrl, id, true));
              }
            }

            if (!url) _error('URL error: "baseUrl" should be defined or "options.url" specified to "get" a resource');

            var _future = options.rawData ? {} : _this.$new({}, options);
            var promise = this.$request.get(url, options).then(function (modelData) {
              if (options.rawData) {
                _future = modelData;
              } else {
                _future.set(modelData, options);
              }

              return _future;
            });

            return promiseHelper.setFuture(promise, _future);
          },

          query: function (query, options) {
            options = options || {};
            options.params = query || {};
            if (options.updateRemoteState !== false) options.updateRemoteState = true;

            var _this = this,
                url = options.url ||
                      urlHelper.combineUrls(options.urlPrefix, options.baseUrl) ||
                      urlHelper.combineUrls(this.urlPrefix, this.baseUrl);

            if (!url) _error('URL error: "baseUrl" should be defined or "options.url" specified to "query" a resource');
            
            var _future = options.rawData ? [] : _this.$newCollection([], options);
            var promise = this.$request.get(url, options).then(function (data) {
              if (options.rawData) {
                _future = data;
              } else {
                _future.reset(data, options);
              }

              return _future;
            });

            return promiseHelper.setFuture(promise, _future);
          },

          all: function (options) {
            options = options || {};
            if (options.updateRemoteState !== false) options.updateRemoteState = true;

            return this.query(null, options);
          }
        });

        // Set this `Model` class above as our default model-type.
        defaultModelClass = Model;

        // Make $request available on  both `Model` class and instances.
        Model.$request = Model.prototype.$request = $request;

        
        // "modelize" function itself (that will be exported)
        // is just a convenience wrapper around .many(...)
        // core method of modelizer.
        var modelize = function (resourceName, options) {
          return coreModelizerMethods.many(resourceName, options);
        };

        _extendWithGetSet(modelize, coreModelizerMethods);
        modelize.attr     = attrBuilder;
        modelize.Model    = defaultModelClass;
        modelize.$request = $request;

        // For testing/stubbing purposes
        modelize.internal = {
          modelizeMetaResolver: modelizeMetaResolver,
          modelClassCache: modelClassCache
        };

        // Shortcut to default Model.extend(...) for convenience
        modelize.defineModel = function (modelName, modelDefinition) {
          return defaultModelClass.extend(modelName, modelDefinition);
        };
    
        // Export public API
        return modelize;

      }];

    })

    .directive('mzModelError', function () {

      return {
        restrict: 'A',
        require: ['?ngModel'],
        link: function (scope, el, attrs, ctrls) {
          var ngModelCtrl = ctrls[0];

          if (!ngModelCtrl || !attrs.mzModelError) return;

          scope.$watch(attrs.mzModelError, function (attrError) {
            var isInvalid = attrError || (angular.isArray(attrError) && attrError.length > 0);
            ngModelCtrl.$setValidity('modelError', !isInvalid);
          });
        }
      };

    });

}));
