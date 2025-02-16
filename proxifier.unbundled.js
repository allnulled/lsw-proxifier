(function (factory) {
  const mod = factory();
  if (typeof window !== 'undefined') {
    window['Proxifier'] = mod;
  }
  if (typeof global !== 'undefined') {
    global['Proxifier'] = mod;
  }
  if (typeof module !== 'undefined') {
    module.exports = mod;
  }
})(function () {

  class BaseClass {
    initialize(...args) {
      const promise = this.onInitialize(...args);
      if(promise instanceof Promise) {
        return promise.then(output => {
          return this;
        });
      }
      return this;
    }
    onInitialize() {
      return this;
    }
  }

  class Proxifier {
    constructor(injection = {}) {
      const that = this;
      this.injection = injection;
      this.classes = {};
      this.Item = class extends BaseClass {
        constructor(value) {
          super(value);
          this.value = value;
          Object.assign(this, that.injection);
        }
      };
      this.List = class extends BaseClass {
        constructor(value) {
          super(value);
          this.value = Array.isArray(value) ? value : [];
          Object.assign(this, that.injection);
        }
        forEach(callback) {
          this.value.forEach(callback);
          return this;
        }
        filter(callback) {
          this.value = this.value.filter(callback);
          return this;
        }
        map(callback) {
          this.value = this.value.map(callback);
          return this;
        }
        reduce(callback, initialValue = []) {
          this.value = this.value.reduce(callback, initialValue);
          return this;
        }
        modify(callback) {
          this.value = callback(this.value);
          return this;
        }
        concat(...lists) {
          this.value = this.value.concat(...lists);
          return this;
        }
        onlyProp(prop) {
          this.value = this.value.map(it => it[prop]);
          return this;
        }
        onlyProps(props) {
          this.value = this.value.map(it => {
            const out = {};
            props.forEach(prop => {
              out[prop] = it[prop];
            });
            return out;
          });
          return this;
        }
        removeProp(prop) {
          return this.removeProps([prop]);
        }
        removeProps(props) {
          this.value = this.value.map(it => {
            const out = {};
            const keys = Object.keys(it).filter(prop => {
              return props.indexOf(prop) === -1;
            });
            keys.forEach(key => {
              out[key] = it[key];
            });
            return out;
          });
          return this;
        }
        deduplicate() {
          const out = [];
          this.value.forEach(it => {
            if (out.indexOf(it) === -1) {
              out.push(it);
            }
          });
          this.value = out;
          return this;
        }
        sort(callback) {
          this.value = this.value.sort(callback);
          return this;
        }
      };
    }
    _get(obj, path) {
      return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }
    _set(obj, path, value) {
      let keys = path.split('.');
      let lastKey = keys.pop();
      let target = keys.reduce((acc, key) => acc[key] ??= {}, obj);
      target[lastKey] = value;
      return obj;
    }
    define(name, ItemClass, ListClass) {
      this._set(this.classes, name, {
        Item: ItemClass,
        List: ListClass
      });
    }
    getFactory() {
      return this.proxify.bind(this);
    }
    proxify(obj) {
      return {
        as: (name, forceSubtype = false, constructorArgs = [], initializeArgs = []) => {
          const ClassDef = this._get(this.classes, name);
          if (!ClassDef) {
            throw new Error(`Required parameter «${name}» to exist as defined class in «typifier.proxify(...).as»`);
          }
          let instance = undefined;
          Instantiation:
          if (!forceSubtype) {
            if (Array.isArray(obj)) {
              instance = new ClassDef.List(obj, ...constructorArgs);
              break Instantiation;
            }
            instance = new ClassDef.Item(obj, ...constructorArgs);
          } else if (["list", "item"].indexOf(forceSubtype) === -1) {
            throw new Error("Required parameter «forceSubtype» to be a valid string or false on «Proxifier.proxify(...).as»");
          } else if (forceSubtype.toLowerCase() === "list") {
            instance = new ClassDef.List(obj, ...constructorArgs);
          } else if (forceSubtype.toLowerCase() === "item") {
            instance = new ClassDef.Item(obj, ...constructorArgs);
          } else {
            throw new Error("This cannot logically happen");
          }
          if(typeof instance.initialize === "function") {
            return instance.initialize(...initializeArgs);
          }
          return this;
        }
      };
    }
  };

  Proxifier.default = Proxifier;

  return Proxifier;

});