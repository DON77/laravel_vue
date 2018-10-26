new Vue({
    el: '#editor',
    data: function() {
      return {
        video: window.video,
        project: window.project,
        ctaElements: window.ctaElements,
        relevantThumbnails: window.relevantThumbnails,
        currentFrameThumbnailInProcess: false,
        customThumbnail: window.customThumbnail,
        currentTime: 0,
        player: {},
        emailProviders: {},
        imageSelections: {},
        changed: false,
        saving: false,
        advancedOptionIsChange: false,
        videoDescription: 'Loading...'
      };
    },
    ready: function() {
      this.loadEmailProviderList();
      this.loadAddCtaElementModal();
      this.loadPlayerOptionsColor();
      this.loadEmbedModal();
      this.watchChanges();
      this.loadTabs();
      return this.loadVideoDescription();
    },
    methods: {
      updateCurrentTime: function(time) {
        var $this;
        this.currentTime = time;
        $this = this;
        $('.cta-timeline').slider("value", time);
        return $($this.ctaElements).each(function(index) {
          var elm;
          elm = $('#cta-element-' + $this.ctaElements[index].id);
          if ($this.ctaElements[index].start_time <= time && $this.ctaElements[index].end_time >= time) {
            if ($this.ctaElements[index].closed !== true) {
              if (!elm.hasClass('show-cta')) {
                elm.addClass('show-cta');
                elm.css({
                  display: 'block'
                });
              }
              $this.ctaElements[index].visible = true;
              return $('#really-cool-video .vjs-control-bar').addClass('hidden');
            }
          } else if ($this.ctaElements[index].visible) {
            elm.removeClass('show-cta');
            $this.ctaElements[index].visible = false;
            $($this.ctaElements[index].$el).addClass('hidden');
            return $('#really-cool-video .vjs-control-bar').removeClass('hidden');
          } else if ($this.ctaElements[index].closed) {
            $this.ctaElements[index].closed = false;
            return $('#really-cool-video .vjs-control-bar').removeClass('hidden');
          }
        });
      },
      toggleVideoTitleEdit: function() {
        var $this;
        $('#videoEditorTitle h3').addClass('hidden');
        $('#videoEditorTitle input').removeClass('hidden').focus();
        $this = this;
        return $(document).on('focusout', '#videoEditorTitle input', function() {
          return $this.saveVideoTitle();
        });
      },
      saveVideoTitle: function(title) {
        if (title == null) {
          title = false;
        }
        title = $('#videoEditorTitle input').val();
        this.saveChanges();
        $('#videoEditorTitle input').addClass('hidden');
        $('#videoEditorTitle h3').removeClass('hidden');
        return $('title').html(title);
      },
      changeThumbnail: function(thumbnail) {
        var libraryButton, targetInput;
        libraryButton = $('.open-image-library-button');
        targetInput = $(libraryButton).data('target-input');
        $(targetInput).trigger('change');
        return this.video.thumbnail = thumbnail;
      },
      thumbnailFromCurrentFrame: function() {
        var $this;
        $this = this;
        this.currentFrameThumbnailInProcess = true;
        return this.$http.get({
          url: route.createThumbnail,
          method: 'POST',
          data: {
            video_id: $this.video.id,
            time: $this.player.currentTime()
          }
        }).then(function(response) {
          $this.customThumbnail = response.data.url;
          $this.changeThumbnail(response.data.url);
          $this.currentFrameThumbnailInProcess = false;
          return;
        })["catch"](function(response) {
          alert(response.message);
          return $this.currentFrameThumbnailInProcess = false;
        });
      },
      loadTabs: function() {
        var $this;
        $this = this;
        $('.video-editor-main-tabs-selectors span').click(function(e) {
          e.preventDefault();
          $(this).tab('show');
          $(this).parent().find('.active').removeClass('active');
          return $(this).addClass('active');
        });
      },
      loadVideoDescription: function() {
        if (this.video.filename === 'imported') {
          return this.$http.get({
            url: route.getVideoDescription,
            method: 'GET',
            data: {
              path: this.video.path
            }
          }).then(function(response) {
            return this.videoDescription = response.data;
          });
        }
      },
      loadPlayerOptionsColor: function() {
        var $this, colorPicker, minicolors;
        $this = this;
        colorPicker = $('.colorpicker', '#collapsePlayerOptions');
        minicolors = colorPicker.minicolors({
          control: 'wheel'
        }).on('change', function() {
          return $this.video.player_options.color = colorPicker.val();
        });
        $(document).on('input', '.colorpicker-hex-input', function() {
          return minicolors.minicolors('value', '#' + $(this).val());
        });
        return $(document).on('click', '.colorpicker-colors .color', function() {
          return minicolors.minicolors('value', $(this).css('background-color'));
        });
      },
      loadEmailProviderList: function() {
        return this.$http.get({
          url: route.getAutoresponderLists,
          method: 'GET'
        }).then(function(response) {
          this.emailProviders = response.data;
          return setTimeout(function() {
            return $('.selectpicker.email-provider-picker').selectpicker('refresh');
          }, 200);
        });
      },
      loadEmbedModal: function() {
        var self;
        self = this;
        $('.share-video-modal-huge').on('shown.bs.modal', function() {
          var $this, loaded;
          $this = $(this);
          loaded = $(this).data('loaded');
          if (loaded === false) {
            if ($('iframe', this).length > 0) {
              $('iframe').each(function() {
                return $(this).attr('src', $(this).attr('data-src'));
              });
            }
            return $this.data('loaded', 'true');
          }
        });
        $(document).on('change', '#postRollAction, #postRollLinkUrl, #pixelTracking, #playbackTracker', function() {
          return self.advancedOptionIsChange = true;
        });
        $(document).on('change', '#videoSize', function() {
          var embedCode, newEmbedCode, value;
          value = $(this).val().split('x');
          embedCode = $('#embedCodeInline').val();
          newEmbedCode = $(embedCode).attr('width', value[0]);
          newEmbedCode = $(newEmbedCode).attr('height', value[1]);
          newEmbedCode = $(newEmbedCode).prop('outerHTML');
          return $('#embedCodeInline').val(newEmbedCode);
        });
        $(document).on('click', '#popover_thumb', function() {
          var container, embedCode, newEmbedCode;
          embedCode = $('#popOverEmbedCodeInline').val();
          container = $($(embedCode)[1]);
          if ($("#popOverVideoResponsiveness").is(':checked')) {
            $('#popover_thumb_width').parent().css('visibility', 'hidden');
            container.attr('style', 'width: 100% !important;');
            container.attr('data-options', 'width=100% height=auto video=' + container.data('id'));
          } else {
            $('#popover_thumb_width').parent().css('visibility', 'visible');
            container.removeAttr('style');
            container.attr('data-options', 'width=' + $('#popover_thumb_width').val() + ' height=' + $('#popover_thumb_height').val() + ' video=' + container.data('id'));
          }
          container.removeAttr('data-text');
          container.html('');
          newEmbedCode = $(embedCode)[0].outerHTML + $(container).prop('outerHTML');
          return $('#popOverEmbedCodeInline').val(newEmbedCode);
        });
        $(document).on('click', '#popover_thumb_text', function() {
          var container, embedCode, newEmbedCode;
          embedCode = $('#popOverEmbedCodeInline').val();
          container = $($(embedCode)[1]);
          if ($("#popOverVideoResponsiveness").is(':checked')) {
            $('#popover_thumb_width').parent().css('visibility', 'hidden');
            container.attr('style', 'width: 100% !important;');
            container.attr('data-options', 'width=100% height=auto video=' + container.data('id'));
          } else {
            $('#popover_thumb_width').parent().css('visibility', 'visible');
            container.removeAttr('style');
            container.attr('data-options', 'width=' + $('#popover_thumb_width').val() + ' height=' + $('#popover_thumb_height').val() + ' video=' + container.data('id'));
          }
          container.attr('data-text', '1');
          container.html('<a href="#">' + $('input[name=popover_thumb_text]').val() + '</a>');
          newEmbedCode = $(embedCode)[0].outerHTML + $(container).prop('outerHTML');
          return $('#popOverEmbedCodeInline').val(newEmbedCode);
        });
        $(document).on('change', '#popover_thumb_width, #popover_thumb_height', function() {
          var container, embedCode, newEmbedCode;
          embedCode = $('#popOverEmbedCodeInline').val();
          container = $($(embedCode)[1]);
          if ($("#popOverVideoResponsiveness").is(':checked')) {
            return;
          } else {
            container.removeAttr('style');
            container.attr('data-options', 'width=' + $('#popover_thumb_width').val() + ' height=' + $('#popover_thumb_height').val() + ' video=' + container.data('id'));
          }
          newEmbedCode = $(embedCode)[0].outerHTML + $(container).prop('outerHTML');
          return $('#popOverEmbedCodeInline').val(newEmbedCode);
        });
        $(document).on('change', '#floating_thumb_width, #floating_thumb_height', function() {
          var container, embedCode, newEmbedCode;
          embedCode = $('#floatingEmbedCodeInline').val();
          container = $($(embedCode)[1]);
          container.attr('style', 'width: ' + $('#floating_thumb_width').val() + 'px !important; height: ' + $('#floating_thumb_height').val() + 'px !important;');
          container.attr('data-options', 'width=100% height=auto video=' + container.data('id'));
          newEmbedCode = $(embedCode)[0].outerHTML + $(container).prop('outerHTML');
          return $('#floatingEmbedCodeInline').val(newEmbedCode);
        });
        $(document).on('change', 'input[name=popover_thumb_text]', function() {
          var container, embedCode, newEmbedCode;
          if (!$('#popover_thumb_text').prop('checked')) {
            return;
          }
          embedCode = $('#popOverEmbedCodeInline').val();
          container = $($(embedCode)[1]);
          if ($("#popOverVideoResponsiveness").is(':checked')) {
            $('#popover_thumb_width').parent().css('visibility', 'hidden');
            container.attr('style', 'width: 100% !important;');
            container.attr('data-options', 'width=100% height=auto video=' + container.data('id'));
          } else {
            $('#popover_thumb_width').parent().css('visibility', 'visible');
            container.removeAttr('style');
            container.attr('data-options', 'width=' + $('#popover_thumb_width').val() + ' height=' + $('#popover_thumb_height').val() + ' video=' + container.data('id'));
          }
          container.attr('data-text', '1');
          container.html('<a href="#">' + $('input[name=popover_thumb_text]').val() + '</a>');
          newEmbedCode = $(embedCode)[0].outerHTML + $(container).prop('outerHTML');
          return $('#popOverEmbedCodeInline').val(newEmbedCode);
        });

        /* handle responsiveness option */
        $(document).on('change', '#popOverVideoResponsiveness', function() {
          var container, embedCode, newEmbedCode;
          embedCode = $('#popOverEmbedCodeInline').val();
          container = $($(embedCode)[1]);
          if ($(this).is(':checked')) {
            $('#popover_thumb_width').parent().css('visibility', 'hidden');
            container.attr('style', 'width: 100% !important;');
            container.attr('data-options', 'width=100% height=auto video=' + container.data('id'));
          } else {
            $('#popover_thumb_width').parent().css('visibility', 'visible');
            container.removeAttr('style');
            container.attr('data-options', 'width=' + $('#popover_thumb_width').val() + ' height=' + $('#popover_thumb_height').val() + ' video=' + container.data('id'));
          }
          newEmbedCode = $(embedCode)[0].outerHTML + $(container).prop('outerHTML');
          return $('#popOverEmbedCodeInline').val(newEmbedCode);
        });

        /* handle responsiveness option */
        $(document).on('change', '#videoResponsiveness', function() {
          var embedCode, newEmbedCode;
          embedCode = $('#embedCodeInline').val();
          if ($(this).is(':checked')) {
            newEmbedCode = $(embedCode).attr('style', 'width: 100% !important;');
          } else {
            newEmbedCode = $(embedCode).removeAttr('style');
          }
          newEmbedCode = $(newEmbedCode).prop('outerHTML');
          return $('#embedCodeInline').val(newEmbedCode);
        });
        $(document).on('input', '#embedWidth', function() {
          var embedCode, newEmbedCode;
          embedCode = $('#embedCode').val();
          newEmbedCode = $(embedCode).find('img').attr('width', $(this).val()).parent();
          newEmbedCode = $(newEmbedCode).prop('outerHTML');
          return $('#embedCode').val(newEmbedCode);
        });
        $(document).on('input', '#embedHeight', function() {
          var embedCode, newEmbedCode;
          embedCode = $('#embedCode').val();
          newEmbedCode = $(embedCode).find('img').attr('height', $(this).val()).parent();
          newEmbedCode = $(newEmbedCode).prop('outerHTML');
          return $('#embedCode').val(newEmbedCode);
        });
        $(document).on('change', '#videoFoam', function() {
          var embedCode, newEmbedCode;
          embedCode = $('#embedCode').val();
          if ($(this).is(':checked')) {
            newEmbedCode = $(embedCode).attr('style', 'width: 100% !important;');
          } else {
            newEmbedCode = $(embedCode).removeAttr('style');
          }
          newEmbedCode = $(newEmbedCode).prop('outerHTML');
          return $('#embedCode').val(newEmbedCode);
        });
        $('.modal-navigation span').click(function(e) {
          e.preventDefault();
          $(this).tab('show');
          $(this).parent().parent().find('.active').removeClass('active');
          return $(this).addClass('active');
        });

        /* handle link change */
        $(document).on('input keyup keypress change', '[data-type="change-public-link"]', function() {
          var target, targetValue;
          if ($('#allowSpecificTimeInLink').is(':checked')) {
            target = $(this).attr('data-target');
            targetValue = $(target).attr('data-base-url') + '/' + $(this).val();
            return $(target).val(targetValue);
          }
        });
        return $(document).on('change input', '#allowSpecificTimeInLink', function() {
          var $this, target, targetValue;
          if ($(this).is(':checked')) {
            $this = $('[data-type="change-public-link"]');
            target = $($this).attr('data-target');
            targetValue = $(target).attr('data-base-url') + '/' + $($this).val();
            return $(target).val(targetValue);
          } else {
            $this = $('[data-type="change-public-link"]');
            target = $($this).attr('data-target');
            targetValue = $(target).attr('data-base-url');
            return $(target).val(targetValue);
          }
        });
      },
      duplicateVideo: function(videoId) {
        var df, self;
        self = this;
        df = function() {
          swal({
            title: 'Duplicating...',
            text: 'This video is being duplicated...',
            type: 'warning',
            showCancelButton: false,
            showConfirmButton: false
          }, function() {
            $('.showSweetAlert h2').html('Duplicating...');
            return $('.sa-button-container').html('<div style="text-align: center; opacity: 0.5"><img src="' + root + '/img/loading.gif"></div>');
          });
          return self.$http.get({
            url: route.duplicateVideo,
            method: 'POST',
            data: {
              id: videoId
            }
          }).then(function(response) {
            response.data.id;
            $('.showSweetAlert h2').html('Duplicated!');
            $('.showSweetAlert p').html('Redirecting to project page...');
            return setTimeout(function() {
              window.location = $('#go-back-to-projects-page').attr('href');
              return $('#go-back-to-projects-page').click();
            }, 300);
          });
        };
        return swal({
          title: 'Duplicate this video?',
          type: 'warning',
          closeOnConfirm: false,
          customClass: 'duplicate-confirm-modal',
          showCancelButton: true,
          showConfirmButton: true
        }, df);
      },
      deleteVideo: function(videoId) {
        var $this;
        $this = this;
        return swal({
          title: 'Are you sure?',
          text: 'Deleted videos are gone forever',
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Delete',
          closeOnConfirm: false,
          cancelButtonText: 'Back to video',
          showLoaderOnConfirm: true
        }, function() {
          $('.showSweetAlert h2').html('Deleting...');
          $('.sa-button-container').html('<div style="text-align: center; opacity: 0.5"><img src="' + root + '/img/loading.gif"></div>');
          return $this.$http.get({
            url: route.destroyVideo,
            method: 'POST',
            data: {
              id: videoId
            }
          }).then(function(response) {
            $('.showSweetAlert h2').html('Deleted!');
            $('.showSweetAlert p').html('Redirecting to project page...');
            return setTimeout(function() {
              window.location = $('#go-back-to-projects-page').attr('href');
              return $('#go-back-to-projects-page').click();
            }, 300);
          });
        });
      },
      loadAddCtaElementModal: function() {
        return $('.hover-tab').on('mouseover', function() {
          $(this).parent().parent().find('.active').removeClass('active');
          $(this).addClass('active');
          return $(this).tab('show');
        });
      },
      addCtaElement: function(ctaElementType) {
        $('.add-cta-modal-huge').modal('hide');
        return this.$http.get({
          url: route.createCtaElement,
          method: 'POST',
          data: {
            type: ctaElementType,
            videoId: this.video.id,
            start_time: this.currentTime
          }
        }).then(function(response) {
          this.ctaElements.push(response.data);
          $('#edit-list .cta-edit-element:last-child').find('.accordion-header').click();
          setTimeout(function() {
            return $('.selectpicker.email-provider-picker').selectpicker('refresh');
          }, 0);
          return $('#edit-list .cta-edit-element:last-child').find('.panel-collapse').addClass('animated fadeIn');
        });
      },
      removeCtaElement: function(ctaElement) {
        var self;
        self = this;
        return swal({
          title: "Are you sure?",
          text: "You want to delete this element",
          type: 'warning',
          showCancelButton: true,
          closeOnConfirm: true
        }, function() {
          self.ctaElements.$remove(ctaElement);
          return self.$http.get({
            url: route.destroyCtaElement,
            method: 'POST',
            data: {
              id: ctaElement.id
            }
          });
        });
      },
      watchChanges: function() {
        var $this;
        $this = this;
        $(document).on('input', '#customize input', function() {
          return $this.changed = true;
        });
        $(document).on('input', '#customize textarea', function() {
          return $this.changed = true;
        });
        $(document).on('click', '#customize .dropdown-menu li', function() {
          return $this.changed = true;
        });
        $(document).on('click', '#library .btn', function() {
          return $this.changed = true;
        });
        $(document).on('click', '.thumbnail-select-wrapper', function() {
          return $this.changed = true;
        });
        $(document).on('click', '[data-type="add-cta-element"]', function() {
          return $this.changed = true;
        });
        $(document).on('click', '#customize label', function() {
          return $this.changed = true;
        });
        $(document).on('minutes-slide', function() {
          return $this.changed = true;
        });
        return window.addEventListener('beforeunload', function(e) {
          var confirmationMessage;
          if ($this.changed === false) {
            return void 0;
          }
          confirmationMessage = 'Changes you have made may be lost. ';
          (e || window.event).returnValue = confirmationMessage;
          return confirmationMessage;
        });
      },
      saveChanges: function() {
        var self;
        self = this;
        if (this.advancedOptionIsChange === true) {
          return swal({
            title: "Advanced Options",
            text: "Are you sure?",
            type: "info",
            showCancelButton: true,
            closeOnConfirm: true
          }, function() {
            self.changed = false;
            self.advancedOptionIsChange = false;
            self.saving = true;
            return self.$http.get({
              url: route.saveEditorChanges,
              method: 'POST',
              data: self._data
            }).then(function(response) {
              self.showSuccessNotification();
              return self.saving = false;
            }, function(erResponse) {
              if (erResponse.status === 401) {
                self.$http.get({
                  url: route.ajaxlogin,
                  method: 'GET',
                  dataType: 'json'
                }).then(function(response) {
                  var loginModal;
                  loginModal = $('#loginModal');
                  loginModal.find('.modal-body').html(response.data.data);
                  return loginModal.modal('show');
                });
              }
              return ;
            });
          });
        } else {
          this.changed = false;
          this.saving = true;
          return this.$http.get({
            url: route.saveEditorChanges,
            method: 'POST',
            data: this._data
          }).then(function(response) {
            self.showSuccessNotification();
            return this.saving = false;
          }, function(erResponse) {
            if (erResponse.status === 401) {
              self.$http.get({
                url: route.ajaxlogin,
                method: 'GET',
                dataType: 'json'
              }).then(function(response) {
                var loginModal;
                loginModal = $('#loginModal');
                loginModal.find('.modal-body').html(response.data.data);
                loginModal.find('input[type=submit]').on('click', function(e) {
                  e.stopPropagation();
                  e.preventDefault();
                  return self.ajaxLogin();
                });
                return loginModal.modal('show');
              });
            }
            return ;
          });
        }
      },
      ajaxLogin: function() {
        var self;
        self = this;
        return this.$http.get({
          url: route.ajaxlogin,
          method: 'POST',
          data: {
            email: $('input[name=email]', '#ajax_login_form').val(),
            password: $('input[name=password]', '#ajax_login_form').val(),
            _token: $('input[name=_token]', '#ajax_login_form').val()
          }
        }).then(function(response) {
          var data;
          data = response.data;
          if (parseInt(data.success) === 1) {
            $('#loginModal').modal('hide');
            return self.saveChanges();
          } else if (data.redirectUrl) {
            return location.href = data.redirectUrl;
          } else {
            return self.showErrorNotification(data.msg);
          }
        });
      },
      showSuccessNotification: function() {
        toastr.options = {
          "closeButton": false,
          "debug": false,
          "newestOnTop": false,
          "progressBar": false,
          "positionClass": "toast-top-full-width",
          "preventDuplicates": true,
          "onclick": null,
          "showDuration": "300",
          "hideDuration": "1000",
          "timeOut": "10000",
          "extendedTimeOut": "1000",
          "showEasing": "swing",
          "hideEasing": "linear",
          "showMethod": "fadeIn",
          "hideMethod": "fadeOut"
        };
        return toastr['success']("Your changes has been successfully  saved");
      },
      showErrorNotification: function(msg) {
        toastr.options = {
          "closeButton": false,
          "debug": false,
          "newestOnTop": false,
          "progressBar": false,
          "positionClass": "toast-top-full-width",
          "preventDuplicates": true,
          "onclick": null,
          "showDuration": "300",
          "hideDuration": "1000",
          "timeOut": "10000",
          "extendedTimeOut": "1000",
          "showEasing": "swing",
          "hideEasing": "linear",
          "showMethod": "fadeIn",
          "hideMethod": "fadeOut"
        };
        return toastr['error'](msg);
      },
      onPlayerLoad: function(choice) {
        var video;
        video = $('#really-cool-video');
        if (choice === 'always') {
          video.addClass('vjs-show-controls');
          video.removeClass('vjs-hide-controls');
          return;
        }
        if (choice === 'on_hover') {
          video.removeClass('vjs-show-controls');
          video.removeClass('vjs-hide-controls');
          return;
        }
        if (choice === 'hide') {
          video.removeClass('vjs-show-controls');
          video.addClass('vjs-hide-controls');
        }
      }
    },
    watch: {
      'video.player_options.control_visibility': function(choice, mutation) {
        var video;
        video = $('#really-cool-video');
        if (choice === 'always') {
          video.addClass('vjs-show-controls');
          video.removeClass('vjs-hide-controls');
          return;
        }
        if (choice === 'on_hover') {
          video.removeClass('vjs-show-controls');
          video.removeClass('vjs-hide-controls');
          return;
        }
        if (choice === 'hide') {
          video.removeClass('vjs-show-controls');
          video.addClass('vjs-hide-controls');
        }
      }
    },
    events: {
      'open-image-library': function(ctaElement) {
        return this.$broadcast('open-image-library', ctaElement);
      },
      'delete-cta-element': function(ctaElement) {
        return this.removeCtaElement(ctaElement);
      },
      'player-loaded': function(player) {
        return this.onPlayerLoad(video.player_options.control_visibility);
      },
      'changed': function() {
        return this.changed = true;
      }
    }
});