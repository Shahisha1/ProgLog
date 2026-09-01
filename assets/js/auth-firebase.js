// Authentication with Firebase
if (typeof window.cacheSession === 'undefined') {
  window.cacheSession = function(session) {
    try {
      localStorage.setItem('proglog_session', JSON.stringify(session));
      if (session && session.username) {
        localStorage.setItem('cabinet_last_user', session.username);
      }
    } catch(e) {}
  };
}

if (typeof window.syncCabinetProfile === 'undefined') {
  window.syncCabinetProfile = function(session) {
    // Simple version
    if (session && session.username) {
      try {
        var cab = JSON.parse(localStorage.getItem('cabinet_data_' + session.username) || '{"games":[]}');
        cab.profile = {
          username: session.username,
          color: session.color || '#16a66f',
          avatar: session.avatar || null,
          createdAt: cab.profile && cab.profile.createdAt ? cab.profile.createdAt : Date.now()
        };
        localStorage.setItem('cabinet_data_' + session.username, JSON.stringify(cab));
      } catch(e) {}
    }
  };
}

if (typeof window.toast === 'undefined') {
  window.toast = function(msg) {
    var wrap = document.getElementById('toast-wrap');
    if (wrap) {
      var el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      wrap.appendChild(el);
      setTimeout(function() { el.remove(); }, 3000);
    }
  };
}
(function() {
  'use strict';

  var state = {
    isSignUp: true,
    currentUser: null,
    step2Color: PROFILE_COLORS[0],
    step2Avatar: null
  };

  var btnSubmit = document.getElementById('btn-step1-submit');

  function isApprovedEmail(email) {
    var value = String(email || '').trim().toLowerCase();
    if (!value || value.indexOf('@') === -1) return false;

    var domain = value.split('@').pop();
    if (!domain) return false;

    var blockedDomains = [
      'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'trashmail.com',
      'dispostable.com', 'fakeinbox.com', 'yopmail.com', 'sharklasers.com', 'mintemail.com',
      'getnada.com', 'maildrop.cc', 'temp-mail.org', 'mailnesia.com'
    ];

    var approvedDomains = [
      'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'yahoomail.com'
    ];

    if (blockedDomains.indexOf(domain) !== -1 || blockedDomains.some(function(item) { return domain === item || domain.endsWith('.' + item); })) {
      return false;
    }

    return approvedDomains.indexOf(domain) !== -1 || approvedDomains.some(function(item) { return domain === item || domain.endsWith('.' + item); });
  }

  function init() {
    
    var params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'login') {
      setMode(false);
    } else if (params.get('mode') === 'profile') {
      checkOAuthSession();
    } else {
      setMode(true);
    }

    bindEvents();
    
    // Wait for Firebase to be ready
    if (window.proglogFirebase && window.proglogFirebase.auth) {
      checkAuthState();
    } else {
      // No Firebase available yet; fall back to the local session.
      // Check local session
      refreshCurrentSession().then(function(session) {
        if (session && session.setupComplete) {
          window.pgGo('overview');
        } else if (session && session.userId) {
          goToStep2(session);
        }
      }).catch(function() {});
    }
  }

  function checkAuthState() {
    if (!window.proglogFirebase || !window.proglogFirebase.auth) return;

    var auth = window.proglogFirebase.auth;
    
    // Check current user immediately
    var currentUser = auth.currentUser;
    if (currentUser) {
      handleAuthenticatedUser(currentUser);
      return;
    }

    // Listen for auth changes
    auth.onAuthStateChanged(function(user) {
      if (user) {
        handleAuthenticatedUser(user);
      }
    });
  }

  function handleAuthenticatedUser(user) {
    if (!user) return;
    
    var db = window.proglogFirebase.db;
    db.collection('users').doc(user.uid).get()
      .then(function(doc) {
        if (doc.exists && doc.data().setupComplete) {
          // Profile complete, go to app
          var session = firebaseUserToSession(user, doc.data());
          window.cacheSession(session);
          window.syncCabinetProfile(session);
          window.pgGo('overview');
        } else {
          // Need to complete profile
          var data = doc.exists ? doc.data() : {};
          var session = firebaseUserToSession(user, data);
          goToStep2(session);
        }
      })
      .catch(function(err) {
        console.warn('Error checking profile:', err);
        // Try to proceed anyway
        var session = firebaseUserToSession(user, {});
        goToStep2(session);
      });
  }

  function checkOAuthSession() {
    if (!window.proglogFirebase || !window.proglogFirebase.auth) return;
    var user = window.proglogFirebase.auth.currentUser;
    if (user) {
      var db = window.proglogFirebase.db;
      db.collection('users').doc(user.uid).get()
        .then(function(doc) {
          var data = doc.exists ? doc.data() : {};
          var session = firebaseUserToSession(user, data);
          goToStep2(session);
        })
        .catch(function() {
          var session = firebaseUserToSession(user, {});
          goToStep2(session);
        });
    }
  }

  function firebaseUserToSession(user, profileData) {
    if (!user) return null;
    var data = profileData || {};
    return {
      userId: user.uid,
      email: user.email,
      username: data.username || user.displayName || (user.email ? user.email.split('@')[0] : 'Hunter'),
      color: data.color || '#16a66f',
      avatar: data.avatar || user.photoURL || null,
      setupComplete: data.setupComplete || false,
      token: user.refreshToken,
      expiresAt: null,
      provider: user.providerData && user.providerData[0] ? user.providerData[0].providerId : 'email'
    };
  }

  function setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.originalLabel = label || button.textContent;
      button.classList.add('is-loading');
      button.innerHTML = '<span class="spinner"></span><span>Working…</span>';
      button.disabled = true;
    } else {
      button.classList.remove('is-loading');
      button.disabled = false;
      button.textContent = button.dataset.originalLabel || label || 'Continue →';
    }
  }

  function showAlert(msg, isSuccess) {
    var alertEl = document.getElementById('auth-alert-msg');
    if (!alertEl) return;
    if (msg) {
      alertEl.textContent = msg;
      alertEl.style.display = 'block';
      alertEl.style.background = isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)';
      alertEl.style.borderColor = isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)';
      alertEl.style.color = isSuccess ? '#10b981' : '#fb7185';
    } else {
      alertEl.style.display = 'none';
    }
  }

  function setMode(signup) {
    state.isSignUp = signup;
    showAlert('');

    var tabSignup = document.getElementById('tab-signup');
    var tabLogin = document.getElementById('tab-login');
    var confirmWrap = document.getElementById('field-confirm-wrap');
    var breadcrumbText = document.getElementById('auth-breadcrumb-text');
    var wizardSteps = document.getElementById('wizard-steps');
    var forgotWrap = document.getElementById('forgot-password-wrap');
    var confirmInput = document.getElementById('input-step1-confirm');

    if (signup) {
      if (tabSignup) {
        tabSignup.style.background = 'var(--bg-surface)';
        tabSignup.style.color = 'var(--text-main)';
        tabSignup.style.fontWeight = '700';
      }
      if (tabLogin) {
        tabLogin.style.background = 'transparent';
        tabLogin.style.color = 'var(--text-muted)';
        tabLogin.style.fontWeight = 'normal';
      }

      if (confirmWrap) confirmWrap.style.display = 'block';
      if (confirmInput) confirmInput.setAttribute('required', 'required');
      if (btnSubmit) btnSubmit.textContent = 'Create Account & Continue →';
      if (breadcrumbText) breadcrumbText.textContent = 'Sign Up';
      if (wizardSteps) wizardSteps.style.display = 'flex';
      if (forgotWrap) forgotWrap.style.display = 'none';
    } else {
      if (tabLogin) {
        tabLogin.style.background = 'var(--bg-surface)';
        tabLogin.style.color = 'var(--text-main)';
        tabLogin.style.fontWeight = '700';
      }
      if (tabSignup) {
        tabSignup.style.background = 'transparent';
        tabSignup.style.color = 'var(--text-muted)';
        tabSignup.style.fontWeight = 'normal';
      }

      if (confirmWrap) confirmWrap.style.display = 'none';
      if (confirmInput) confirmInput.removeAttribute('required');
      if (btnSubmit) btnSubmit.textContent = 'Sign In to Proglog →';
      if (breadcrumbText) breadcrumbText.textContent = 'Sign In';
      if (wizardSteps) wizardSteps.style.display = 'none';
      if (forgotWrap) forgotWrap.style.display = 'block';
    }
  }

  function goToStep2(session) {
    state.currentUser = session;
    showAlert('');

    var dot1 = document.getElementById('dot-step1');
    var dot2 = document.getElementById('dot-step2');
    if (dot1) {
      dot1.className = 'step-dot done';
      var numSpan = dot1.querySelector('.num');
      if (numSpan) numSpan.innerHTML = '✓';
    }
    if (dot2) {
      dot2.className = 'step-dot active';
    }

    var step1 = document.getElementById('step1-container');
    var step2 = document.getElementById('step2-container');
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'block';

    var nameInput = document.getElementById('step2-hunter-name');
    if (nameInput) {
      nameInput.value = session.username || (session.email ? session.email.split('@')[0] : 'Hunter');
    }
    if (session.avatar) {
      state.step2Avatar = session.avatar;
    }
    if (session.color) {
      state.step2Color = session.color;
    }

    if (window.applyProglogTheme) window.applyProglogTheme(state.step2Color);
    drawStep2Swatches();
    updateStep2Preview();
    setProfileSetupNavigationLock(true);
  }

  function setProfileSetupNavigationLock(locked) {
    document.body.classList.toggle('profile-setup-active', !!locked);
    document.querySelectorAll('.global-sidebar a[data-nav], .auth-nav-links a').forEach(function(link) {
      if (locked) {
        link.setAttribute('aria-disabled', 'true');
        link.addEventListener('click', profileNavGuard);
      } else {
        link.removeAttribute('aria-disabled');
        link.removeEventListener('click', profileNavGuard);
      }
    });
  }

  function profileNavGuard(event) {
    event.preventDefault();
    if (window.toast) window.toast('Finish your profile setup before leaving this page.');
  }

  function drawStep2Swatches() {
    var wrap = document.getElementById('step2-color-swatches');
    if (!wrap) return;
    wrap.innerHTML = '';
    PROFILE_COLORS.forEach(function(c) {
      var sw = document.createElement('div');
      sw.className = 'swatch' + (c === state.step2Color ? ' selected' : '');
      sw.style.background = c;
      sw.addEventListener('click', function() {
        state.step2Color = c;
        if (window.applyProglogTheme) window.applyProglogTheme(c);
        updateStep2Preview();
        drawStep2Swatches();
      });
      wrap.appendChild(sw);
    });
  }

  function updateStep2Preview() {
    var prev = document.getElementById('step2-pfp-preview');
    if (!prev) return;
    if (state.step2Avatar) {
      prev.innerHTML = '<img src="' + window.esc(state.step2Avatar) + '" alt="Avatar Preview">';
      prev.style.background = 'none';
    } else {
      var nameVal = (document.getElementById('step2-hunter-name').value || 'PV').trim();
      prev.innerHTML = '<span style="font-family:\'JetBrains Mono\'; font-weight:700; font-size:20px; color:#06080e;">' + window.esc(window.initials(nameVal)) + '</span>';
      prev.style.background = state.step2Color;
    }
  }

  // ==================== AUTH FUNCTIONS ====================

  function registerWithFirebase(email, password) {
    var auth = window.proglogFirebase.auth;
    return auth.createUserWithEmailAndPassword(email, password)
      .then(function(result) {
        var user = result.user;
        // Send verification email
        return user.sendEmailVerification()
          .then(function() {
            return user.updateProfile({
              displayName: email.split('@')[0]
            });
          })
          .then(function() {
            // Store in Firestore
            var db = window.proglogFirebase.db;
            return db.collection('users').doc(user.uid).set({
              email: user.email,
              username: email.split('@')[0],
              color: '#16a66f',
              avatar: null,
              setupComplete: false,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          })
          .then(function() {
            return {
              userId: user.uid,
              email: user.email,
              username: email.split('@')[0],
              color: '#16a66f',
              avatar: null,
              setupComplete: false,
              needsEmailConfirmation: true
            };
          });
      });
  }

  function loginWithFirebase(email, password) {
    var auth = window.proglogFirebase.auth;
    return auth.signInWithEmailAndPassword(email, password)
      .then(function(result) {
        var user = result.user;
        // Check email verification
        if (!user.emailVerified) {
          return auth.signOut().then(function() {
            throw new Error('Please verify your email before logging in. Check your inbox.');
          });
        }
        // Load profile from Firestore
        var db = window.proglogFirebase.db;
        return db.collection('users').doc(user.uid).get()
          .then(function(doc) {
            var profile = doc.data() || {};
            var session = {
              userId: user.uid,
              email: user.email,
              username: profile.username || user.displayName || user.email.split('@')[0],
              color: profile.color || '#16a66f',
              avatar: profile.avatar || user.photoURL || null,
              setupComplete: profile.setupComplete || false,
              token: user.refreshToken,
              expiresAt: null
            };
            window.cacheSession(session);
            window.syncCabinetProfile(session);
            return session;
          });
      });
  }

  function signInWithProvider(provider) {
    if (!window.proglogFirebase || !window.proglogFirebase.auth) {
      return Promise.reject(new Error('Firebase not configured'));
    }

    var authProvider;
    if (provider === 'google') {
      authProvider = new firebase.auth.GoogleAuthProvider();
    } else if (provider === 'github') {
      authProvider = new firebase.auth.GithubAuthProvider();
    } else {
      return Promise.reject(new Error('Unsupported provider'));
    }

    return window.proglogFirebase.auth.signInWithPopup(authProvider)
      .then(function(result) {
        var user = result.user;
        var db = window.proglogFirebase.db;
        
        return db.collection('users').doc(user.uid).get()
          .then(function(doc) {
            if (doc.exists) {
              var data = doc.data();
              var session = {
                userId: user.uid,
                email: user.email,
                username: data.username || user.displayName || user.email.split('@')[0],
                color: data.color || '#16a66f',
                avatar: data.avatar || user.photoURL || null,
                setupComplete: data.setupComplete || false,
                token: user.refreshToken,
                expiresAt: null
              };
              window.cacheSession(session);
              window.syncCabinetProfile(session);
              return session;
            } else {
              // New user - create profile
              return db.collection('users').doc(user.uid).set({
                email: user.email,
                username: user.displayName || user.email.split('@')[0],
                color: '#16a66f',
                avatar: user.photoURL || null,
                setupComplete: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              }).then(function() {
                var session = {
                  userId: user.uid,
                  email: user.email,
                  username: user.displayName || user.email.split('@')[0],
                  color: '#16a66f',
                  avatar: user.photoURL || null,
                  setupComplete: false,
                  token: user.refreshToken,
                  expiresAt: null
                };
                window.cacheSession(session);
                window.syncCabinetProfile(session);
                return session;
              });
            }
          });
      });
  }

  function completeProfileWithFirebase(userId, profileData) {
    var auth = window.proglogFirebase.auth;
    var user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found.');
    }

    // Upload avatar if provided
    var avatarPromise = Promise.resolve(profileData.avatar || null);
    if (profileData.avatar && profileData.avatar.startsWith('data:image')) {
      avatarPromise = uploadAvatar(user.uid, profileData.avatar);
    }

    return avatarPromise.then(function(avatarUrl) {
      // Update user profile
      return user.updateProfile({
        displayName: profileData.username,
        photoURL: avatarUrl || user.photoURL
      });
    }).then(function() {
      // Update Firestore
      var db = window.proglogFirebase.db;
      return db.collection('users').doc(user.uid).set({
        username: profileData.username,
        color: profileData.color,
        avatar: profileData.avatar || user.photoURL || null,
        setupComplete: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }).then(function() {
      // Reload user to get updated metadata
      return user.reload();
    }).then(function() {
      var updatedUser = window.proglogFirebase.auth.currentUser;
      var session = {
        userId: updatedUser.uid,
        email: updatedUser.email,
        username: updatedUser.displayName || profileData.username,
        color: profileData.color,
        avatar: updatedUser.photoURL || profileData.avatar || null,
        setupComplete: true,
        token: updatedUser.refreshToken,
        expiresAt: null
      };
      window.cacheSession(session);
      window.syncCabinetProfile(session);
      return session;
    });
  }

  function uploadAvatar(uid, dataUrl) {
    var storage = window.proglogFirebase.storage;
    var ref = storage.ref('avatars/' + uid + '.jpg');
    
    return fetch(dataUrl)
      .then(function(res) { return res.blob(); })
      .then(function(blob) {
        return ref.put(blob, { contentType: 'image/jpeg' });
      })
      .then(function(snapshot) {
        return snapshot.ref.getDownloadURL();
      });
  }

  // ==================== EVENT BINDING ====================

  function bindEvents() {
    var tabSignup = document.getElementById('tab-signup');
    var tabLogin = document.getElementById('tab-login');
    if (tabSignup) tabSignup.addEventListener('click', function() { setMode(true); });
    if (tabLogin) tabLogin.addEventListener('click', function() { setMode(false); });

    // Step 1 Form Handler
    var formStep1 = document.getElementById('form-step1');
    if (formStep1) {
      formStep1.addEventListener('submit', function(e) {
        e.preventDefault();
        showAlert('');

        var email = document.getElementById('input-step1-email').value.trim();
        var pass = document.getElementById('input-step1-pass').value;

        if (!isApprovedEmail(email)) {
          showAlert('Only approved Google or Yahoo email addresses are allowed. Proxy or disposable email domains are not permitted.');
          return;
        }

        if (state.isSignUp) {
          var confirm = document.getElementById('input-step1-confirm').value;
          if (pass !== confirm) {
            showAlert('Passwords do not match. Please verify and try again.');
            return;
          }
          if (pass.length < 6) {
            showAlert('Password must be at least 6 characters long.');
            return;
          }

          setLoading(btnSubmit, true, 'Create Account & Continue →');
          
          if (window.proglogFirebase && window.proglogFirebase.auth) {
            registerWithFirebase(email, pass)
              .then(function(session) {
                if (session.needsEmailConfirmation) {
                  var finish = function() {
                    showAlert('Account created. Check your email to verify it, then sign in.', true);
                    setMode(false);
                    var emailEl = document.getElementById('input-step1-email');
                    if (emailEl) emailEl.value = email;
                    var passEl = document.getElementById('input-step1-pass');
                    if (passEl) passEl.value = '';
                  };
                  if (window.proglogFirebase && window.proglogFirebase.auth) {
                    return window.proglogFirebase.auth.signOut().then(finish);
                  }
                  finish();
                  return;
                }
                window.toast('Account created! Set up your profile next.');
                goToStep2(session);
              })
              .catch(function(err) {
                showAlert(window.proglogApp ? window.proglogApp.friendlyError(err) : (err.message || 'Registration failed.'));
              })
              .finally(function() {
                setLoading(btnSubmit, false, 'Create Account & Continue →');
              });
          } else {
            window.registerAccount(email, pass)
              .then(function(session) {
                window.toast('Account created! Set up your profile next.');
                goToStep2(session);
              })
              .catch(function(err) {
                showAlert(err.message || 'Registration failed.');
              })
              .finally(function() {
                setLoading(btnSubmit, false, 'Create Account & Continue →');
              });
          }
        } else {
          setLoading(btnSubmit, true, 'Sign In to Proglog →');
          
          if (window.proglogFirebase && window.proglogFirebase.auth) {
            loginWithFirebase(email, pass)
              .then(function(session) {
                window.toast('Welcome back, ' + session.username + '!');
                if (session.setupComplete) {
                  setTimeout(function() { window.pgGo('overview'); }, 350);
                } else {
                  goToStep2(session);
                }
              })
              .catch(function(err) {
                showAlert(window.proglogApp ? window.proglogApp.friendlyError(err) : (err.message || 'Login failed.'));
              })
              .finally(function() {
                setLoading(btnSubmit, false, 'Sign In to Proglog →');
              });
          } else {
            window.authenticateUser(email, pass)
              .then(function(session) {
                window.toast('Welcome back, ' + session.username + '!');
                if (session.setupComplete) {
                  setTimeout(function() { window.pgGo('overview'); }, 350);
                } else {
                  goToStep2(session);
                }
              })
              .catch(function(err) {
                showAlert(err.message || 'Login failed.');
              })
              .finally(function() {
                setLoading(btnSubmit, false, 'Sign In to Proglog →');
              });
          }
        }
      });
    }

    var forgotBtn = document.getElementById('btn-forgot-password');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', function() {
        var emailEl = document.getElementById('input-step1-email');
        var email = emailEl ? emailEl.value.trim() : '';
        if (!email) {
          showAlert('Enter your email address first.');
          if (emailEl) emailEl.focus();
          return;
        }
        if (!window.proglogFirebase || !window.proglogFirebase.auth) {
          showAlert('Password reset is unavailable while cloud authentication is offline.');
          return;
        }
        var btn = this;
        var original = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending…';
        window.proglogFirebase.auth.sendPasswordResetEmail(email)
          .then(function() { showAlert('Password reset email sent. Check your inbox.', true); })
          .catch(function(err) { showAlert(window.proglogApp ? window.proglogApp.friendlyError(err) : (err.message || 'Could not send reset email.')); })
          .finally(function() { btn.disabled = false; btn.textContent = original; });
      });
    }

    // OAuth Buttons
    var googleBtn = document.getElementById('btn-oauth-google');
    if (googleBtn) {
      googleBtn.addEventListener('click', function() {
        if (!window.proglogFirebase || !window.proglogFirebase.auth) {
          showAlert('Social sign-in requires Firebase configuration.');
          return;
        }
        var btn = this;
        setLoading(btn, true, 'Continue with Google');
        signInWithProvider('google')
          .then(function(session) {
            if (session.setupComplete) {
              window.pgGo('overview');
            } else {
              goToStep2(session);
            }
          })
          .catch(function(err) {
            showAlert(window.proglogApp ? window.proglogApp.friendlyError(err) : (err.message || 'Google sign-in failed.'));
          })
          .finally(function() {
            setLoading(btn, false);
          });
      });
    }

    var githubBtn = document.getElementById('btn-oauth-github');
    if (githubBtn) {
      githubBtn.addEventListener('click', function() {
        if (!window.proglogFirebase || !window.proglogFirebase.auth) {
          showAlert('Social sign-in requires Firebase configuration.');
          return;
        }
        var btn = this;
        setLoading(btn, true, 'Continue with GitHub');
        signInWithProvider('github')
          .then(function(session) {
            if (session.setupComplete) {
              window.pgGo('overview');
            } else {
              goToStep2(session);
            }
          })
          .catch(function(err) {
            showAlert(window.proglogApp ? window.proglogApp.friendlyError(err) : (err.message || 'GitHub sign-in failed.'));
          })
          .finally(function() {
            setLoading(btn, false);
          });
      });
    }

    // Step 2 Avatar file upload
    var pfpInput = document.getElementById('step2-file-input');
    if (pfpInput) {
      pfpInput.addEventListener('change', function(e) {
        var file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            window.toast('Please choose an image under 2MB.');
            return;
          }
          var reader = new FileReader();
          reader.onload = function(evt) {
            var img = new Image();
            img.onload = function() {
              var size = 256;
              var scale = Math.min(size / img.width, size / img.height, 1);
              var canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(img.width * scale));
              canvas.height = Math.max(1, Math.round(img.height * scale));
              var ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              state.step2Avatar = canvas.toDataURL('image/jpeg', 0.82);
              updateStep2Preview();
            };
            img.src = evt.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    var step2NameInput = document.getElementById('step2-hunter-name');
    if (step2NameInput) {
      step2NameInput.addEventListener('input', updateStep2Preview);
    }

    // Step 2 Form Handler
    var formStep2 = document.getElementById('form-step2');
    if (formStep2) {
      formStep2.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = (document.getElementById('step2-hunter-name').value || '').trim();
        if (!name) return;

        if (!state.currentUser) {
          window.pgGo('auth');
          return;
        }

        var submit = formStep2.querySelector('button[type=submit]');
        setLoading(submit, true, 'Complete Setup & Open Proglog →');
        if (window.applyProglogTheme) window.applyProglogTheme(state.step2Color);

        var userId = state.currentUser.userId;

        if (window.proglogFirebase && window.proglogFirebase.auth) {
          completeProfileWithFirebase(userId, {
            username: name,
            color: state.step2Color,
            avatar: state.step2Avatar
          }).then(function(session) {
            window.toast('Profile saved. Welcome to Proglog.');
            setTimeout(function() { window.pgGo('overview'); }, 350);
          }).catch(function(err) {
            showAlert(window.proglogApp ? window.proglogApp.friendlyError(err) : (err.message || 'Your profile could not be saved.'));
          }).finally(function() {
            setLoading(submit, false, 'Complete Setup & Open Proglog →');
          });
        } else {
          window.completeProfileSetup(userId, {
            username: name,
            color: state.step2Color,
            avatar: state.step2Avatar
          }).then(function(completed) {
            if (!completed) throw new Error('Your account could not be updated.');
            window.toast('Profile saved. Welcome to Proglog.');
            setTimeout(function() { window.pgGo('overview'); }, 350);
          }).catch(function(err) {
            showAlert(err.message || 'Your profile could not be saved.');
          }).finally(function() {
            setLoading(submit, false, 'Complete Setup & Open Proglog →');
          });
        }
      });
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();