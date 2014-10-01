# AngularJS Modelizer

Simple and lightweight yet feature-rich models to use with AngularJS apps. Started as a loose port of [Backbone models](http://backbonejs.org/#Model), inspired by [Restangular](https://github.com/mgonto/restangular) and [Ember.Data](http://emberjs.com/api/data/modules/ember-data.html) but with AngularJS in mind and with different features. Follows the "Convention over Configuration" principle and significantly reduces the amount of boilerplate code necessary for trivial actions.

---

- [Getting started](#getting-started)
- [Features](#features)
- [Guide](#guide)
  - [Defining/extending models](#definingextending-models)
  - [Model static methods](#model-static-methods)
  - [Extending collections](#extending-collections)
  - [Model names and `modelClassCache`](#model-names-and-modelclasscache)
  - [Resolving model classes](#resolving-model-classes)
  - [Initializing models](#initializing-models)
  - [Fetching model data](#fetching-model-data)
  - [Using model static methods to query remote data](using-model-static-methods-to-query-remote-data)
  - [Saving models](#saving-models)
  - [Deleting models](#deleting-models)
  - [Model `diff`ing](#model-diffing)
  - [Serialization notes](#serialization-notes)
  - [Using `$request` for arbitrary HTTP requests](#using-request-for-arbitrary-http-requests)
  - [Tracking model `$loading` state](#tracking-model-loading-state)
  - [Parsing validation errors](#parsing-validation-errors)
  - [mzModelError directive](#mzmodelerror-directive)
- [API reference](#api-reference) _(Coming soon!)_
- [Contributing](#contributing)
- [License](#license)

---

## Getting started

### Dependencies

Modelizer depends on `angular` ~~and `lodash`~~ (since version **0.2.0** Modelizer 
doesn't depend on `lodash` anymore). Supported Angular versions are **1.2.X** and **1.3.X**.

_Note: Angular 1.0.X and 1.1.X might just be supported as well because
Modelizer does not really rely on too many Angular components,
only `$q` and `$http` services._


### Installation

With bower:

    $ bower install angular-modelizer --save


Attach to your app (with dependencies):

```html
<!-- index.html -->
<script src="angular.js"></script>
<script src="lodash.js"></script>
<script src="angular-modelizer.js"></script>
```

```javascript
// app.js
angular.module('app', ['angular-modelizer']);
```


### Define model

This step is completely optional unless some rich `model` or `collection` attributes are needed

```javascript
angular.module('app')

  .run(['modelize', function (modelize) {
    // Note: `modelize.defineModel(...)` is an alias for `modelize.Model.extend(...)`

    modelize.defineModel('post', {
      baseUrl: '/posts',

      // `id` is assumed to be created by the server
      name: '',
      title: 'New post', // `New post` becomes the default value
      publishedOn: modelize.attr.date(),
      author: modelize.attr.model({ modelClass: 'user' }),
      comments: modelize.attr.collection({ modelClass: 'comment' })
    });
  }])  

  // Expose as an Angular service for convenience
  .factory('Post', ['modelize', function (modelize) {
    return modelize('post').$modelClass;
  }]);

}]);
```


### Use your model in a controller

```javascript
angular.module('app').controller('PostListCtrl', ['$scope', 'Post', function ($scope, Post) {

  $scope.posts = Post.$newCollection();
  $scope.posts.fetch();

  // OR

  Post.all().then(function (posts) {
    $scope.posts = posts;
  });

  // OR

  $scope.posts = Post.all().$future;

}]);
```
**OR**
```javascript
angular.module('app').controller('PostCtrl', ['$scope', 'modelize', function ($scope, modelize) {

  // modelizer automatically resolves the class by model name,
  // plural model name, or baseUrl. If no model "classes" are
  // found during resolution, it falls back to default `Model`
  $scope.posts = modelize('posts').$newCollection();
  $scope.posts.fetch();

  // OR

  $scope.posts = modelize('posts').all().$future;

}]);
```

**See [Guide](#guide) and [API Reference](#api-reference) for more detail.**


## Features

- **Easy and straightforward** model definition/extension
- **Clean and intuitive model/collection API**
- **Custom model classes** are completely optional, default `Model` would suffice for many cases
- **Special types of attributes** for custom model classes with `modelize.attr` helper. Custom attributes can be `model`, `collection`, `computed` or `date` (`date` is WIP)
- **Automatic model "class" resolution** based on specified model name, collection name (pluralized model name in fact) or base URL with fallback to default `Model` when no appropriate model isn't found
- **Resource URL building** by using "modelizer" chains (e.g., `modelize('blog').one('post', 123).many('comments')`). That takes the custom models `baseUrl` property into account for convenience.
- **All model-related requests return Promises** enhanced with `$future` object that represents the result of request wrapped into model or collection
- **Collections are `Array` instances** with custom methods mixed in (`Array` prototype is **not** modified) so can be used with AngularJS as regular arrays.
- **Model maintains the last known server state** and can perform a `diff` to see whats changed. Very useful to perform `PATCH` operations.
- **Models and collections track "loading" state** accessible via `$loading` property. Useful to show spinners, progress bars, etc
- **Models maintain links to all the collections they're in**. These links are automatically removed when models are `destroy()`ed or removed from collections explicitly
- **Parses model validation errors** from responses with `422` status code and maintains `$modelErrors` property. Useful to use in templates with `ngMessages`
- Many more smaller features and hidden gems - see [Guide](#guide) for details.


**Possible future features:**
- **Multiple `modelize` contexts** configuration that work with different APIs *(being designed)*
- **Decoupled `store` layer** to maintain model data locally for offline-first approach *(being discussed)*
- **Identity maps** for underlying store *(being discussed)*
- **Relation attribute type** via `modelize.attr.relation.hasMany(...)` and `modelize.attr.relation.belongsTo(...)` *(being discussed)*
- **Real-time utility module** for easy real-time sync via WebSockets out of the box *(reviewing the possibilities)*



## Guide

Modelizer is a very simple thing. It provides the default `Model` class which is sufficient for many use cases unless some attribute should be a `model` or a `collection` of particular model class on its own.

### Defining/extending models

- Default `Model` is exposed as `modelize.Model` property
- New model class can be defined by calling `modelize.defineModel()` method or `modelize.Model.extend()` (the former is the shortcut for the latter)
- Custom models can be extended further by calling `MyCustomModel.extend()`.
- `defineModel()` and `extend()` return model "class". It is convenient to wrap it into Angular service (e.g., `.factory(...)`) that returns that model class.
- There is a `modelize.attr` property to help define custom model attributes:
  - **`modelize.attr.model(options)`** to define a rich model property
  - **`modelize.attr.model(options)`** to define a collection property
  - **`modelize.attr.computed(computeFn)`** to define a "computed" property with no setter. Pass the `computeFn` function as a parameter
  - **`modelize.attr.date(options)`** to define a property of `Date` type. While you could use just regular property for that, using this attribute helper ensures that the property will always have the `Date` type.
  - Provide optional `modelClass: SomeModelClass` option to specify what model class that attribute should have. Only applicable to `attr.model` and `attr.collection`. If not specified, the default `Model` is set as attribute `modelClass`.
  - Properties defined with `modelize.attr` are lazily initialized. Objects and arrays of objects of particular type are only created when requested
  - **When defining model attributes as `modelize.attr.model()` or `modelize.attr.collection()` make sure the dependency models are defined already.** Thats why its worth calling `modelize.defineModel()` or `modelize.Model.extend()` inside Angular `run` blocks.
  - If string is provided as `modelClass: ...` option to `modelize.attr.model()` or `modelize.attr.collection()` then its **class will be lazily resolved at the time attribute is requested for a first time**.
- If your model should have some other attribute as `id`, use `idAttribute` property to define that
- If you define a value for some attribute, it will become its default value
- Static model class methods are defined inside special `static` property

**Code speaks louder than plain English does:**
```javascript
// app/models/post.js
angular.module('app')

  .run(['modelize', function (modelize) {
    // Note: `modelize.defineModel(...)` is an alias for `modelize.Model.extend(...)`

    return modelize.defineModel('post', {
      baseUrl: '/posts',

      // `id` is assumed to be created by the server
      name: '',
      title: 'New post', // `New post` becomes the default value
      publishedOn: modelize.attr.date(), // Make sure `publishedOn` is always a Date object
      author: modelize.attr.model({ modelClass: 'user' }), // Define nested model
      comments: modelize.attr.collection({ modelClass: 'comment' }) // Define collection property
    });
  }])

  .factory('Post', ['modelize', function (modelize) {
    return modelize('post').$modelClass;
  }]);

// app/models/comment.js
angular.module('app')

 .run(['modelize', function (modelize) {
    modelize.defineModel('comment', {
      baseUrl: '/comments',

      // `id` is assumed to be created by the server
      text: '',
      author: modelize.attr.model({ modelClass: 'user' })
    });
  }])

 .factory('Comment', ['modelize', function (modelize) {
    return modelize('comment').$modelClass;
  }]);
```


### Model static methods

To define custom static methods for model (to use alongside default `all()`,
`query()`, `get()`, etc) you could:
```javascript
// When defining the custom model itself
modelize.defineModel('post', {
  title: '',
  ...

  static: {
    getRecent: function () {
      return this.$request.get(this.baseUrl + '/recent');
    }
  }
});

// Using pure JavaScript
Post.getRecent = function () {
  return this.$request.get(this.baseUrl + '/recent');
};
```


### Extending collections

The collection in **Modelizer** is just a regular JavaScript `Array` with
some methods, properties and "state" mixed in for convenience. Aside
from default set of methods and properties, you could add your own.

This is done using either of two main ways:

**1. Extend collection when defining model:**
```javascript
modelize.defineModel('post', {
  title: '',
  ...

  collection: {
    someCollectionMethod: function () {
      // ...
    }
  }
});
```
**2. Extend collection afterwards.**

Useful if you want to extend the arbitrary model class including default `Model`.
Please notice that **`extendCollection` method modifies the model class it is
being called on by extending its internal metadata**.
```javascript
var Post = modelize.defineModel('post', {
  title: '',
  ...
});

Post.extendCollection({
  someCollectionMethod: function () {
    // ...
  }
});
```
*Note: `extendCollection` returns the model class it has been called on.*


### Model names and `modelClassCache`

`modelClassCache` is where model classes are stored internally for fast lookups by:
- Model name
- Collection name
- Model `baseUrl`

This is needed for correct model class [resolution](#model-class-resolution).

Model class appears on the `modelClassCache` every time new model is defined
with `modelize.defineModel(...)`, `modelize.Model.extend(...)` or `SomeModelClass.extend(...)`.

All of above-mentioned methods accept model name as the first parameter.
This is the name under which the model class appears in `modelClassCache`:
```javascript
modelize.defineModel('post', { ... });
```

**But what about collection name?**

Well, by default the collection name is generated internally based on the specified model name:
```javascript
// collection name is 'posts'
modelize.defineModel('post', { ... });

// collection name is 'comments'
modelize.defineModel('comment', { ... });

// collection name is 'princesses'
// Note: ends with 's', so 'es' is appended
modelize.defineModel('princess', { ... });
```

But you could specify that explicitly too by providing array of `String`s as the first argument
to `Model.extend(...)`:
```javascript
// collection name is 'companys' which is hardly desired
modelize.defineModel('company', { ... });

// collection name is 'companies'
modelize.defineModel(['company', 'companies'], { ... });

// collection name is 'colossi'
modelize.defineModel(['colossus', 'colossi'], { ... });
```


### Model `baseUrl` and `urlPrefix`

You could set the `baseUrl` when defining model:
```javascript
// all instances of `post` model will have '/posts' base URL unless
// explicitly overridden for particular instance
var Post = modelize.defineModel('post', {
  baseUrl: '/posts'
});
```

Or when creating the new model instance:
```javascript
// post1 will have '/posts' baseUrl
var post1 = Post.$new();

// post2 will have '/some/special/posts' baseUrl
var post2 = Post.$new({ baseUrl: '/some/special/posts' });
```

If you don't provide the `baseUrl` on either model definition or new instance creation,
it will be automatically generated based on `collectionName`:
```javascript
var Post = modelize.defineModel('post', {
  // No baseUrl is set here
});

// post will have '/posts' baseUrl
var post = Post.$new();


var Mouse = modelize.defineModel(['mouse', 'mice'], {
  // No baseUrl is set here
});

// mouse will have '/mice' baseUrl
var mouse = Mouse.$new();
```

**Note:** `baseUrl` is a special property and is excluded from model upon serialization.


**`urlPrefix`** is a simple property whose value will be prepended to `baseUrl`
when resolving model instance **resource URL**.

**Why is that given we already have `baseUrl`?**
Well, this way we allow different `urlPrefix`es in different contexts while allow
models to handle `baseUrl` on their own. This is heavily used for dynamic URL building
on model class resolution.


### Model class resolution

This is the sweet thing in Modelizer. Basically, in order to work with models, you have
to get the "model class" somehow first to create model or collection instances, or use
convenience static methods like `all()` or `get()`.

You could just get the model class directly as a value returned from `modelize.defineModel(...)`:
```javascript
// app/models/post.js
angular.module('app').factory('Post', ['modelize', function (modelize) {

  // Just make the `Post` angular service return the Post model class
  return modelize.defineModel('post', {
    // No baseUrl is set here
  });

}]);

// app/controllers/post-list-ctrl.js
angular.module('app').controller('PostListCtrl', ['Post', function (Post) {

  // Init new collection of `Post` models
  $scope.posts = Post.$newCollection();

  // Request all posts using static method on model class
  Post.all().then(function (posts) {
    $scope.posts = posts;
  });

}]);
```

---
_**Note:** **You don't need to know all the internal detail in order to use
the Modelizer API.** But if you're curious - make sure to read carefully
since the stuff below might be a bit complicated to get right away._

There is also another way to obtain the model class and this is where the `Modelizer`
object comes into play.

**The core API is:**
- `modelize.one(resourceName, [id])`
- `modelize.many(resourceName)`
- `modelize(resourceName)` which is just a shortcut for `modelize.many(resourceName)`

**Some points to note:**
- These `one()` and `many()` methods **return `Modelizer` instance** that in turn
  exposes the methods to create model instances and request remote data. But before
  we're able to work with models, we should know what model class we need to use.
- `modelize.one()` returns the `Modelizer` instance with `modelModelizer` methods
  mixed in and is intended to work in the context of a single item (e.g., has methods
  like `save()` or `destroy()`)
- `modelize.many()` and `modelize()` return the `Modelizer` instance with
  `collectionModelizer` methods mixed in and is intended to work in the context
  of a collection of items (e.g. has methods like `query()`, `get()`, `all()`, etc)
- Resolved model class is exposed as a `$modelClass` property on `Modelizer`
- If no model class is found in `modelClassCache` by `Modelizer`, it falls back to
  default `modelize.Model`
- **Aside from resolving the model class, `Modelizer` also defines the `baseUrl`
  and `urlPrefix` that should be set on model instances.**
- All methods that make HTTP requests return promises. These promises are enhanced
  with `$future` property whose value is already initialized model or collection
  but without server data. Model/collection is being updated with actual data
  when that is returned from server (similar to how Angular `$resource` works
  and to Restangular `$object` property on promises).

The model class resolution strategy relies on the fact that `resourceName` argument
can be either:
- Model property name
- Model name
- Collection name
- Model `baseUrl`


**Basic examples** (see next sections for more):

```javascript
// Lets define some models first:
// =============================

modelize.defineModel('post', {
  baseUrl: '/blog/posts',
  comments: modelize.attr.collection({
    modelClass: 'comment',
    baseUrl: '/special-comments'
  })
});

modelize.defineModel('comment', {
  baseUrl: '/comments',
  ...
});


// Then use that (e.g., in a controller):
// =====================================

// Resolves to 'post' model (by collection name)
// and exposes the 'collection modelizer'
modelize('posts');

// Resolves to 'post' model (by model name)
// and exposes the 'model modelizer'
modelize.one('post', 123);

// Resolves to 'post' model (by collection name)
// and exposes the 'model modelizer'
modelize.one('posts', 123);

// Resolves to 'comment' model (by collection name)
// and exposes the 'collection modelizer'
// The baseUrl is set to '/comments' (taken from 'comment' model class)
modelize('comments');

// Resolves to 'comment' model (by 'post' model attrubute name)
// and exposes the 'collection modelizer'
// The urlPrefix is set to '/blog/posts'
// The baseUrl is set to '/special-comments'
// (taken from 'post' attribute definition metadata)
modelize.one('posts', 123).many('comments');

// No custom model is found, resolves to default Model class
// baseUrl is set to '/things'
modelize('things');

// No custom model is found, resolves to default Model class
// baseUrl is set to '/things/123/subthings'
modelize('things/123/subthings');

// No custom model is found, resolves to default Model class
// baseUrl is set to '/subthings'
// urlPrefix is set to '/things/123'
modelize.one('things', 123).many('subthings');

// No custom model is found (because Post baseUrl is /blog/posts in our case),
// resolves to default Model class instead. Only searched by baseUrl since provided
// `resourceName` is immediately considered URL because of '/'.
// baseUrl is set to '/posts'
modelize('/posts');
```

*Refer to the next sections on detail about how to work with these
model classes and model data.*


### Initializing models

You can easily create new model and collection instances:

```javascript
// Using model "class":
// ===================

// Empty collection
var posts = Post.$newCollection();

// Collection With data
var posts = Post.$newCollection([{
  title: 'Post 1',
  ...
}, {
  title: 'Post 2',
  ...
}]);

// Empty model
var post = Post.$new();
var post = new Post();

// Model with some attributes set
var post = Post.$new({ title: 'Post 1' });
var post = new Post({ title: 'Post 1' });


// Same thing using `Modelizer`:
// ============================

var posts = modelize('posts').$newCollection();
// OR
var posts = modelize('posts').$newCollection([{ ... }, { ... }, { ... }]);

var post = modelize('posts').$new();
// OR
var post = modelize.one('post').$new();
var post = modelize.one('posts').$new();
var post = modelize.one('posts').$new({ ... });
```


### Fetching model data

You can easily fetch the model data by calling `fetch()` on model instance.
Note that `fetch()` method accepts `url` option to fetch from arbitrary
URL. `options` are also passed to the underlying `$http` service calls
so feel free to provide any `params` or `headers` there.

```javascript
// Note: all methods that work with HTTP return promises

// Fetch collection
// ================

// Create empty collection
var posts = Post.$newCollection();
// OR
var posts = modelize('posts').$newCollection();

// Then fetch the entire collection
// GET /posts
posts.fetch(); // returns promise


// Fetch single item
// =================

var post = modelize('posts').$new({ id: 123 });

// GET /posts/123
post.fetch();

// Get first item from already "fetched" collection
// Note that item already has the 'id' attribute set
var post = posts[0];

// GET /posts/123
post.fetch(); // Sync, returns promise

// GET /some/custom/url-to-fetch
post.fetch({ url: '/some/cusom/url-to-fetch' }); // returns promise

// GET /posts/123/comments
post.comments.fetch(); // Property defined with 'modelize.attr.collection()'
```


### Using model static methods to query remote data

Model class exposes a set of concenience methods to make remote requests
that return promises resolved with either model or collection instance
(depending on method). As usual, methods can be invoked on model class
directly or via modelizer.

```javascript
// Get a single item
// =================

// GET /posts/123
modelize('posts').get(123).then(function (post) {
  // Note: Use promise callbacks when you have
  // something to do after request has completed.
  // In simple cases just use `$future` property
  // of modelizer promises.
  $scope.post = post;
});
// OR
var post = Post.get(123).$future;
var post = modelize('posts').get(123).$future;
var post = modelize.one('post', 123).get().$future;


// Get collection of items
// =======================

// GET /posts
var posts = modelize('posts').all().$future;
// OR
var posts = Post.all().$future;

// GET /posts?published=false
var posts = modelize('posts').query({ published: false }).$future;
```


### Saving models

Once you have changed the model data, you might need its new state to be posted
back to the API server. This is what model `save()` method for. Depending on
current model state and data, we can either **create**, **update** or **partially
update** the model data on the server.

- Overridable `isNew()` is invoked on the model before saving. Default `isNew()` implementation
  only checks whether there is an `id` (or whatever `idAttribute` is) set on the
  model instance. If that returns `true` then the `POST` request is sent to
  the model `baseUrl` (or `url` passed as an option).
- If the model isn't considered new, then the `PUT` request is sent to a resource URL
  that model represents.
- Pass the `patch: true` option to perform a `PATCH` operation instead of `PUT`
  (only makes effect when the model is not `isNew()`)
- When performing `PATCH` updates, the model performs the `diff` between its current
  state and last known remote state and only sends the changed attributes
  (or completely new ones).

There is also a `save()` method on `Modelizer` that accepts the data to
send to the server. This method basically initializes the new model with provided data
and calls `save()` on it. So, all the same rules (from above) apply here.

```javascript
// Using `save()` method on Modelizer
// =================================

// POST /posts
modelize('posts').save({ title: 'Some post title' });

// PUT /posts/123
modelize('posts').save({ id: 123, title: 'Some post title' });

// PATCH /posts/123
modelize('posts').save({ id: 123, title: 'Some post title' }, { patch: true });


// Using `model.save()` method
// =========================

// Create an item
var post = modelize('posts').$new({ title: 'Some new title' });
// Does not cause an update since
// we've never saved the model before
post.title = 'Some other title';

// POST /posts
post.save(); // returns promise


// There is also a convenience `create()` method on collection:
var posts = modelize('posts').all().$future;
...
// POST /posts
posts.create({ title: 'Some new post' }); // returns promise


// Note: Changing properties does not cause an update since
// we've never saved the model before.
var post = modelize('posts').$new({ title: 'Some new title' });
post.title = 'Some other title';

// POST /posts
post.save(); // returns promise


// Update an item
var post = modelize('posts').get(123).$future;
...
post.title = 'Another title';

// PUT /posts/123
post.save();


// Partially update an item
var post = modelize('posts').get(123).$future;
...
post.title = 'Another title';

// PATCH /posts/123
post.save({ patch: true });
```


### Deleting models

Deleting models is extraordinary simple. Again, both model instance and
`Modelizer` have `destroy()` methods for this.

- By default, when the model is "destroyed", it is removed from collections
  that contain it.
- If the model was never saved, no HTTP request is issued and model is
  just removed from collections.
- Provide `wait: true` option to wait until HTTP request completes
  before removing the model from collections.
- When the model is destroyed, its `$destroyed` property value becomes `true`.
- Model `destroy()` method accepts the `keepInCollections: true` option
  to prevent it from being removed from collections. Be careful, because
  from now on, the collection is in somewhat inconsistent state and
  handling that is developers responsibility (i.e., using explicit
  `collection.remove(model)`). This might be useful if you want to keep
  your model inside the collection marked as `$destroyed` for some reason
  (like allowing to "undo").

```javascript
// Using `destroy()` method on Modelizer
// =================================

// DELETE /posts/123
modelize('posts').destroy(123);


// Using `model.destroy()` method
// =========================

// No request is done in this case since we never saved the model
var post = modelize('posts').$new({ title: 'Some new title' });
post.destroy(); // returns promise


// Now get the post for below examples
var post = modelize('posts').get(123);

// Deleting post, immediately remove from collections
// DELETE /posts/123
post.destroy(); // returns promise

// Deleting post, but wait for the successful response before
// removing from collections
// DELETE /posts/123
post.destroy({ wait: true }); // returns promise

// Deleting post, but keep the model in collections.
// Use with caution! The collection is in inconsistent state now.
// DELETE /posts/123
post.destroy({ keepInCollections: true }); // returns promise

// In any case, post obtains the $destroyed property
post.$destroyed; // true
```


### Serialization notes

Model has the following methods to assist serialization:
- `getAttributes()`
- `getChangedAttributes()`
- `serialize()`
- `toJSON()`

The `getAttributes()` method is used to only get "serializable"
attributes of a model. Note that **reserved** properties are excluded
from that set of attributes. Specify `includeComputed: true` option to
have computed properties added to resulting object.

The current list of reserved properties is the following:
```javascript
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
```

There is also a `getChangedAttributes()` method that only returns
attributes that are changed since the last known server
state. Used to perform `PATCH` operations. Uses `diff` method
internally (see next section).

The `serialize()` method on a model simply calls `getAttributes()`
and then handles the special cases when some model attribute
is a `model` or `collection` on its own (and calls `serialize()`
on them).

The `serialize()` method on a collection only runs `serialize()`
on each model from that collection and returns the array
of serialized models.

The `toJSON()` method only transforms the already `serialize()`d
models to actual JSON string.



### Model `diff`ing

The model saves its last known server state internally and
when attributes change, it knows how to perform the correct
`PATCH`. How is that? Well, thats what `diff` for.

Model performs `diff` between current and last known server state
in the `changedAttributes()` method.

`diff` can be performed against any other object though. It doesn't
compare models by reference and instead compares attribute values
one by one. So, any object can be used to `diff` model against.
The final diff is a hash of differences only keyed with attribute name
and contains current and compared value:
```javascript
var post = modelize('post').$new({
  title: 'Some post title',
  text: 'Some text'
});

var diff = post.diff({ title: 'Some other title', text: 'Some text' });
// `diff` is now as the following:
// {
//   title: {
//     currentValue: 'Some post title',
//     comparedValue: 'Some other title'
//   }
// }
```


### Using `$request` for arbitrary HTTP requests

You can perform arbitrary HTTP requests by using
the same convenience wrapper around Angular `$http`
service - modelizer `$request`. The only thing it does
is makes successful requests promises being resolved
with `data` only and not entire response (pass `rawData: true`
option to obtain the entire response as `$http` does by default).
It also adds convenience `$future` object to promises.

For convenience, the `$request` is set as a property of:
- `modelize`
- Model class
- Model instance
- Collection instance

All the options of `$request` methods are passed to corresponding
`$http` methods so `params`, `data`, `method`, `headers`, etc are
all acceptable.

```javascript
// Make arbitrary HTTP requests

// posts isn't a model or collection, just a regular object here
var posts = modelize.$request.get('/blog/posts').$future;

// Note: We don't work with Models here at all, just raw requests
// Create an item
modelize.$request.post('/blog/posts', {
  title: 'Some post title',
  text: 'Some post text'
});

// Update an item
modelize.$request.put('/blog/posts/123', {
  title: 'Some updated post title',
  text: 'Some updated post text'
});

// Perform a partial update
modelize.$request.patch('/blog/posts/123', {
  title: 'Some updated post title'
});


// Useful to define custom model and collection methods
// that need to perform some HTTP calls.
modelize.defineModel('post', {
  title: '',
  text: '',

  someCustomAction: function () {
    return this.$request.post(this.resourceUrl() + '/some-custom-action',
      this.getAttributes({ includeComputed: true }));
  },

  static: {
    getRecent: function () {
      // `this` is now model class, it has $request property too
      return this.$request.get(this.baseUrl + '/recent');
    }
  },

  collection: {
    someCollectionMethod: function () {
      // collections have $request property as well
      return this.$request.get(...);
    }
  }
})
```


### Tracking model `$loading` state

One of pretty common use cases is to show some kind of
loading indicator (aka "spinner") while HTTP request associated
with model is being performed.

This is what model or collection `$loading` property for.
It always returns `true` when there is active request for a model
or collection (either to fetch data, update or destroy the model).
The "loading" state tracker is attached to the model as the `_loadingTracker`
property. It supports the `addPromise()` method so feel free to add new
promises which will cause the model to be `$loading`.

This property is one of the reserved properties so its not included
when model is serialized.

**Assume we have model/collection on the controller `$scope`:**
```javascript
// post-list-ctrl.js
angular.module('app').controller('PostListCtrl', ['$scope', 'modelize',
  function ($scope, modelize) {

    $scope.posts = modelize('posts').all().$future;

  }]);
```
**Show spinners while the entire collection or a single model is loading:**
```html
<div class="list-loading-spinner" ng-show="posts.$loading">
  The list of posts is loading...
</div>
<div ng-repeat="post in posts">
  <div class="single-post-loading-spinner" ng-show="post.$loading">
    Post is loading...
  </div>
  <h1>{{ post.title }}</h2>
  <div>
    ...
  </div>
</div>
```


### Parsing validation errors

When model save fails, the promise `save()` method returns is rejected
with error server responds with. The `model.save()` method handles that
error as well by parsing the validation error and maintains the `$modelErrors`
object with:
- Keys named after model attriubute names
- Values having arrays of error messages from the server

To parse the error response, model has the `parseModelErrors()` method
which by default uses the configurable global `parseModelErrors()`. Note
that global `parseModelErrors()` only handles server errors with status
code `422 Unprocessable entity`

So, to change the error parsing logic, you could:
- Override the `parseModelErrors()` method for particular model class.
- Override the global `parseModelErrors()` method by configuring
the `modelizeProvider`.

**The default server response format is expected to have these fields:**
```json
{
  "fieldErrors": [{
    "field": "name",
    "message": "Your name field is invalid"
  }, {
    "field": "description",
    "message": "Your description field is invalid"
  }, {
    "field": "description",
    "message": "Yet another problem with your description"
  }]
}
```

**Model maintains its `$modelErrors` property in the following form:**
```javascript
{
  name: ['Some name error'],
  description: ['Some descriotion error', 'Another description error']
}
```

**Override easily:**
```javascript

// Override for marticular model class
modelize.defineModel('thing', {
  name: '',
  description: '',

  parseModelErrors: function (responseData, options) {
    // Custom parsing logic
    // ...

    // Result should follow the format: 
    return {
      name: ['Some name error'],
      description: ['Some descriotion error', 'Another description error']
    };
  }
});

// Override global one
angular.module('app').config(['modelizeProvider', function (modelizeProvider) {
  // This will be applied to all model classes
  // unless explicitly overridden for particular model
  modelizeProvider.parseModelErrors = function (responseData, options) {
    // Custom parsing logic
    // ...
  };
});
```


### `mzModelError` directive

There is a tiny `mzModelError` directive in Modelizer
to help you to show model errors to the user. Requires `ng-model`
attribute set on the same element.

In the example below, the message with `modelError` validation token
will appear for form control when server returns the error for `title`
field on `post` model. See previous section on how these errors are parsed.
```html
<form name="postForm" novalidate>
  <imput name="title" required minlength="4" ng-model="post.title" mz-model-error="post.$modelErrors.title">

  <!-- Show the errors with ngMessages -->
  <div ng-messages="post.title.$error">
    <div ng-message="required">The title is required for a blog post</div>
    <div ng-message="minlength">The title should be at least 4 charactes long</div>
    <div ng-message="modelError">
      <div ng-repeat="err in post.$modelErrors.title">{{ err }}</div>
    </div>
</form>
```
_Note: **`mzModelError` can work with any object**,
not only modelizer models. The error will appear on
`postForm.title.$error` under `modelError` key_.



## API reference

_Coming soon!_


## Contributing

If you have found some bug or want to request some new feature, please use **GitHub Issues** to let us know about that. Pull Requests are welcome too.


## License

[MIT](http://opensource.org/licenses/MIT)
