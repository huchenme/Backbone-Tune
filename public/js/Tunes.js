(function($) {

  // Models

  window.Album = Backbone.Model.extend({
    isFirstTrack: function(index) {
      return index == 0;
    },

    isLastTrack: function(index) {
      return index >= this.get('tracks').length - 1;
    },

    trackUrlAtIndex: function(index) {
      var tracks = this.get('tracks');
      if( tracks != null && tracks.length >= index ) {
        return this.get('tracks')[index].url;
      }
      return null;
    }
  });

  // Collections

  window.Albums = Backbone.Collection.extend({
    model: Album,
    url: '/albums'
  });

  window.Playlist = Albums.extend({
    isFirstAlbum: function(index) {
      return index == 0;
    },

    isLastAlbum: function(index) {
      return index == this.models.length - 1;
    },
  });

  window.Player = Backbone.Model.extend({
    defaults: {
      'currentAlbumIndex': 0,
      'currentTrackIndex': 0,
      'state': 'stop'
    },

    initialize: function() {
      this.playlist = new Playlist();
    },

    play: function() {
      this.set({'state': 'play'});
    },

    pause: function() {
      this.set({'state': 'pause'});
    },

    isPlaying: function() {
      return (this.get('state') == 'play');
    },

    isStopped: function() {
      return (!this.isPlaying());
    },

    currentAlbum: function() {
      return this.playlist.at(this.get('currentAlbumIndex'));
    },

    currentTrackUrl: function() {
      var album = this.currentAlbum();
      return album.trackUrlAtIndex(this.get('currentTrackIndex'));
    },

    prevTrack: function() {
      var currentTrackIndex = this.get('currentTrackIndex'),
          currentAlbumIndex = this.get('currentAlbumIndex');
      if(this.currentAlbum().isFirstTrack(currentTrackIndex)) {
        if (this.playlist.isFirstAlbum(currentAlbumIndex)) {
          this.set({'currentAlbumIndex': this.playlist.models.length - 1});
        } else {
          this.set({'currentAlbumIndex': currentAlbumIndex - 1});
        }
        var lastTrackIndex = this.currentAlbum().get('tracks').length - 1;
        this.set('currentTrackIndex', lastTrackIndex);
      } else {
        this.set({'currentTrackIndex': currentTrackIndex - 1});
      }
      this.logCurrentAlbumAndTrack();
    },

    nextTrack: function() {
      var currentTrackIndex = this.get('currentTrackIndex'),
          currentAlbumIndex = this.get('currentAlbumIndex');
      if(this.currentAlbum().isLastTrack(currentTrackIndex)) {
        if (this.playlist.isLastAlbum(currentAlbumIndex)) {
          this.set({'currentAlbumIndex': 0});
          this.set({'currentTrackIndex': 0});
        } else {
          this.set({'currentAlbumIndex': currentAlbumIndex + 1});
          this.set({'currentTrackIndex': 0});
        }
      } else {
        this.set({'currentTrackIndex': currentTrackIndex + 1});
      }
      this.logCurrentAlbumAndTrack();
    },

    logCurrentAlbumAndTrack: function() {
      console.log("Player " + this.get('currentAlbumIndex') + ':' + this.get('currentTrackIndex'), this);
    }
  });

  window.player = new Player();

  window.library = new Albums();

  // Views

  window.AlbumView = Backbone.View.extend({
    tagName: 'li',
    className: 'album',

    initialize: function() {
      // _.bindAll(this, 'render');
      this.model.bind('change', this.render, this);
      // this.model.on('change', this.render, this);
      this.template = _.template($('#album-template').html());
    },

    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });

  window.LibraryView = Backbone.View.extend({
    tagName: 'section',
    className: 'library',

    initialize: function() {
      // _.bindAll(this, 'render');
      this.template = _.template($('#library-template').html());
      this.collection.on('reset', this.render, this);
    },

    render: function() {
      var $albums,
          collection = this.collection;

      $(this.el).html(this.template({}));
      $albums = this.$(".albums");
      collection.each(function(album) {
        var view = new LibraryAlbumView ({
          model: album,
          collection: collection
        });
        $albums.append(view.render().el);
      });
      return this;
    }
  });

  window.LibraryAlbumView = AlbumView.extend({
    events: {
      'click .queue.add': "select"
    },

    select: function() {
      this.collection.trigger('select', this.model);
    }
  });

  window.PlaylistAlumnView = AlbumView.extend({

  });

  window.PlaylistView = Backbone.View.extend({
    tagName: 'section',
    className: 'playlist',

    initialize: function() {
      this.template = _.template($('#playlist-template').html());
      this.collection.on('reset', this.render, this);
      this.collection.on('add', this.renderAlbum, this);
      this.player = this.options.player;
      this.library = this.options.library;
      this.library.on('select', this.queueAlbum, this);
    },

    render: function() {
      $(this.el).html(this.template(this.player.toJSON()));
      this.$('button.play').toggle(this.player.isStopped());
      this.$('button.pause').toggle(this.player.isPlaying());
      return this;
    },

    queueAlbum: function(album) {
      this.collection.add(album);
    },

    renderAlbum: function(album) {
      var view = new PlaylistAlumnView({
        model: album,
        player: this.player,
        playlist: this.collection
      });
      this.$('ul').append(view.render().el);
    }
  });

  // Router

  window.BackboneTunes = Backbone.Router.extend({
    routes: {
      '': 'home',
      'blank': 'blank'
    },

    initialize: function() {
      this.libraryView = new LibraryView({
        collection: window.library
      });

      this.playlistView = new PlaylistView({
        collection: window.player.playlist,
        player: window.player,
        library: window.library
      });
    },

    home: function() {
      var $container = $('#container');
      $container.empty();
      $container.append(this.playlistView.render().el);
      $container.append(this.libraryView.render().el);
    },

    blank: function() {
      var $container = $('#container');
      $container.empty();
      $container.text('blank');
    }
  });

  // Initialize

  $(function() {
    window.App = new BackboneTunes();
    Backbone.history.start({
      pushState: true
    });
  });

})(jQuery);
