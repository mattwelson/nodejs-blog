var prismic = require('prismic-nodejs');
var configuration = require('./prismic-configuration');
var app = require('./config');

// Connect to the prismic API
app.use((req, res, next) => {
  prismic.api(configuration.apiEndpoint,{accessToken: configuration.accessToken, req: req})
    .then((api) => {
    req.prismic = {api: api}
    res.locals.ctx = {
      endpoint: configuration.apiEndpoint,
      linkResolver: configuration.linkResolver
    }
    next()
  }).catch(function(err) {
    if (err.status == 404) {
      res.status(404).send("There was a problem connecting to your API, please check your configuration file for errors.");
    } else {
      res.status(500).send("Error 500: " + err.message);
    }
  });
})

// Return the current page of request
function currentPage(request) {
  return request.params.p || '1';
}

// Homepage
exports.bloghome = function(req, res) {
  
  // Query the homepage
  req.prismic.api.getSingle("bloghome").then(function(bloghome) {
    
    // If a document is returned...
    if(bloghome) {
      
      // Define page and options
      var page = currentPage(req);
      var options = {
        'page' : page,
        'orderings' :'[my.post.date desc]'
      };
      
      // Query the posts
      req.prismic.api.query(
        prismic.Predicates.at("document.type", "post"),
        options
      ).then(function(response) {
        
        // Render the blog homepage
        res.render('bloghome', {
          'bloghome' : bloghome,
          'posts' : response.results
        });
      });
      
    // If a bloghome document is not returned, give an error
    } else {
      res.status(404)
        .send('Not found');
    }
  });
};

// Post Pages
exports.post = function(req, res) {
  
  // Define the uid from the url
  var uid = req.params.uid;
  
  // Query the post by its uid
  req.prismic.api.getByUID('post', uid).then(function(post) {
    
    // If a document is returned, render the post
    if(post) {
      res.render('post', {
        'post': post
      });
      
    // Else give an error
    } else {
      res.status(404)
        .send('Not found');
    }
  });
};

// Preview functionality of prismic.io
exports.preview = function(req, res) {
  return prismic.preview(req.prismic.api, configuration.linkResolver, req, res);
};
