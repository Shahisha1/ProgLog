// Proglog Multi-Step Authentication & Onboarding Controller
(function() {
  'use strict';

  var state = {
    isSignUp: true,
    currentSession: null,
    step2Color: PROFILE_COLORS[0],
    step2Avatar: null
  };

  // Shared reference to the step-1 submit button, used by both setMode()
  // and the form submit handler. The script tag is at the end of the body,
  // so the element already exists in the DOM at this point.
  var btnSubmit = document.getElementById('btn-step1-submit');

  function init() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'login') {
      setMode(false);
    } else {
      setMode(true);
    }

    bindEvents();
  }

  function setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.originalLabel = label || button.textContent;
      button.classList.add('is-loading');
      button.innerHTML = '<span class=\"spinner\"></span><span>Working…</span>';
      button.disabled = true;
    } else {
      button.classList.remove('is-loading');
      button.disabled = false;
      button.textContent = button.dataset.originalLabel || label || 'Continue →';
    }
  }

  function showAlert(msg) {
    var alertEl = document.getElementById('auth-alert-msg');
    if (!alertEl) return;
    if (msg) {
      alertEl.textContent = msg;
      alertEl.style.display = 'block';
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

    if (signup) {
      tabSignup.style.background = 'var(--bg-surface)';
      tabSignup.style.color = 'var(--text-main)';
      tabSignup.style.fontWeight = '700';
      tabLogin.style.background = 'transparent';
      tabLogin.style.color = 'var(--text-muted)';
      tabLogin.style.fontWeight = 'normal';

      confirmWrap.style.display = 'block';
      document.getElementById('input-step1-confirm').setAttribute('required', 'required');
      btnSubmit.textContent = 'Create Account & Continue →';
      if (breadcrumbText) breadcrumbText.textContent = 'Sign Up';
      if (wizardSteps) wizardSteps.style.display = 'flex';
    } else {
      tabLogin.style.background = 'var(--bg-surface)';
      tabLogin.style.color = 'var(--text-main)';
      tabLogin.style.fontWeight = '700';
      tabSignup.style.background = 'transparent';
      tabSignup.style.color = 'var(--text-muted)';
      tabSignup.style.fontWeight = 'normal';

      confirmWrap.style.display = 'none';
      document.getElementById('input-step1-confirm').removeAttribute('required');
      btnSubmit.textContent = 'Sign In to Proglog →';
      if (breadcrumbText) breadcrumbText.textContent = 'Sign In';
      if (wizardSteps) wizardSteps.style.display = 'none';
    }
  }

  function goToStep2(session) {
    state.currentSession = session;
    showAlert('');

    // Update wizard indicators
    var dot1 = document.getElementById('dot-step1');
    var dot2 = document.getElementById('dot-step2');
    if (dot1) {
      dot1.className = 'step-dot done';
      dot1.querySelector('.num').innerHTML = '✓';
    }
    if (dot2) {
      dot2.className = 'step-dot active';
    }

    // Toggle container views
    document.getElementById('step1-container').style.display = 'none';
    document.getElementById('step2-container').style.display = 'block';

    // Pre-populate Step 2
    var nameInput = document.getElementById('step2-hunter-name');
    if (nameInput) {
      nameInput.value = session.username || session.email.split('@')[0];
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
      prev.innerHTML = '<img src="' + esc(state.step2Avatar) + '" alt="Avatar Preview">';
      prev.style.background = 'none';
    } else {
      var nameVal = (document.getElementById('step2-hunter-name').value || 'PV').trim();
      prev.innerHTML = '<span style="font-family:\'JetBrains Mono\'; font-weight:700; font-size:20px; color:#06080e;">' + esc(initials(nameVal)) + '</span>';
      prev.style.background = state.step2Color;
    }
  }

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
          registerAccount(email, pass, 'email').then(function(session) {
            if (session && session.needsEmailConfirmation) {
              showAlert('Account created. Check your email to verify the account, then log in to finish your profile.');
              setMode(false);
              document.getElementById('input-step1-email').value = session.email || email;
              return;
            }
            toast('Account created. Set up your profile next.');
            goToStep2(session);
          }).catch(function(err) {
            showAlert(err.message || 'Registration failed.');
          }).finally(function() { setLoading(btnSubmit, false, 'Create Account & Continue →'); });
        } else {
          setLoading(btnSubmit, true, 'Sign In to Proglog →');
          authenticateUser(email, pass).then(function(session) {
            toast('Welcome back, ' + session.username + '!');
            if (session.setupComplete) {
              setTimeout(function() { window.location.href = 'app.html'; }, 350);
            } else {
              goToStep2(session);
            }
          }).catch(function(err) {
            showAlert(err.message || 'Login failed.');
          }).finally(function() { setLoading(btnSubmit, false, 'Sign In to Proglog →'); });
        }
      });
    }

    // Real OAuth when Supabase is configured.
    [['btn-oauth-google', 'google'], ['btn-oauth-github', 'github']].forEach(function(pair) {
      var btn = document.getElementById(pair[0]);
      if (!btn) return;
      btn.addEventListener('click', function() {
        if (!window.proglogSupabaseConfigured) {
          showAlert('Social sign-in needs Supabase configuration. Email/password works locally until you connect Supabase.');
          return;
        }
        setLoading(btn, true, btn.textContent);
        window.proglogSupabase.auth.signInWithOAuth({
          provider: pair[1],
          options: { redirectTo: window.location.origin + window.location.pathname }
        }).then(function(result) {
          if (result.error) throw result.error;
        }).catch(function(err) {
          showAlert(err.message || 'Social sign-in could not be started.');
          setLoading(btn, false);
        });
      });
    });

    // Step 2 Avatar file upload
    var pfpInput = document.getElementById('step2-file-input');
    if (pfpInput) {
      pfpInput.addEventListener('change', function(e) {
        var file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            toast('Please choose an image under 2MB.');
            return;
          }
          var reader = new FileReader();
          reader.onload = function(evt) {
            var img = new Image();
            img.onload = function() {
              // Keep the avatar small enough for Supabase user metadata.
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

        if (!state.currentSession) {
          window.location.href = 'auth.html';
          return;
        }

        var submit = formStep2.querySelector('button[type=submit]');
        setLoading(submit, true, 'Complete Setup & Open Proglog →');
        if (window.applyProglogTheme) window.applyProglogTheme(state.step2Color);
        Promise.resolve(completeProfileSetup(state.currentSession.userId, {
          username: name,
          color: state.step2Color,
          avatar: state.step2Avatar
        })).then(function(completed) {
          if (!completed) throw new Error('Your account could not be updated. Please sign in again.');
          toast('Profile saved. Welcome to Proglog.');
          setTimeout(function() { window.location.href = 'app.html'; }, 350);
        }).catch(function(err) {
          showAlert(err.message || 'Your profile could not be saved.');
        }).finally(function() {
          setLoading(submit, false, 'Complete Setup & Open Proglog →');
        });
      });
    }
  }

  init();
  refreshCurrentSession().then(function(session) {
    if (!session) return;
    if (session.setupComplete) {
      window.location.href = 'app.html';
    } else if (session.userId) {
      goToStep2(session);
    }
  }).catch(function() {});
})();
