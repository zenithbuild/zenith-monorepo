
// Phase 2: Reactive text bindings runtime
(function() {
  let __zen_bindings = {};

  // Update function for a specific state
  function __zen_update_bindings(stateName, value) {
    const nodes = __zen_bindings[stateName];
    if (nodes) {
      nodes.forEach(node => {
        if (node) {
          node.textContent = String(value);
        }
      });
    }
  }


  // Initialize state: count
  (function() {
    let __zen_count = 0;
    Object.defineProperty(window, "count", {
      get: function() { return __zen_count; },
      set: function(value) {
        __zen_count = value;
        __zen_update_bindings("count", value);
      },
      enumerable: true,
      configurable: true
    });
  })();
  // Initialize state: message
  (function() {
    let __zen_message = "Hello from compiler!";
    Object.defineProperty(window, "message", {
      get: function() { return __zen_message; },
      set: function(value) {
        __zen_message = value;
        __zen_update_bindings("message", value);
      },
      enumerable: true,
      configurable: true
    });
  })();
  // Initialize state: score
  (function() {
    let __zen_score = 100;
    Object.defineProperty(window, "score", {
      get: function() { return __zen_score; },
      set: function(value) {
        __zen_score = value;
        __zen_update_bindings("score", value);
      },
      enumerable: true,
      configurable: true
    });
  })();

  // Initialize binding map and bindings after DOM is ready
  function __zen_init_bindings() {
    __zen_bindings = {
        "count": [document.querySelector("span[data-zen-bind=\"count\"][data-zen-bind-id=\"bind-0\"]"), document.querySelector("span[data-zen-bind=\"count\"][data-zen-bind-id=\"bind-1\"]")],
        "message": [document.querySelector("span[data-zen-bind=\"message\"][data-zen-bind-id=\"bind-2\"]")],
        "score": [document.querySelector("span[data-zen-bind=\"score\"][data-zen-bind-id=\"bind-3\"]")]
      };
        __zen_update_bindings("count", count);
        __zen_update_bindings("message", message);
        __zen_update_bindings("score", score);
  }

  // Initialize bindings when DOM is ready (scripts are deferred, so DOM should be ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __zen_init_bindings);
  } else {
    __zen_init_bindings();
  }
})();



      /* 
       * Zenith Compiler: State Declarations
       * 
       * The 'state' keyword is custom Zenith syntax processed at compile time.
       * Linter errors for 'state' are expected and can be safely ignored.
       * The compiler removes these declarations from the output and generates
       * proper runtime code. See compiler/parse.ts for implementation.
       */
      
      // Test logging helper
      function log(message) {
        const logEl = document.getElementById('test-log');
        if (logEl) {
          const time = new Date().toLocaleTimeString();
          logEl.setHTML(logEl.innerHTML + `<div>[${time}] ${message}</div>`);
          logEl.scrollTop = logEl.scrollHeight;
        }
        console.log(message);
      }

      // Test: addClass and removeClass
      function sayHi(event, el) {
        el.addClass('clicked');
        log("✓ addClass('clicked') - Button clicked!");
        setTimeout(() => {
          el.removeClass('clicked');
          log("✓ removeClass('clicked') - Class removed after 1s");
        }, 1000);
      }

      // Test: setText
      function updateValue(event, el) {
        const value = el.value;
        const displayEl = document.getElementById('value-display');
        if (displayEl) {
          displayEl.setText(`Current value: "${value}"`);
          log(`✓ setText() - Input value: "${value}"`);
        }
      }

      // Test: hide
      function submitForm(event, el) {
        event.preventDefault();
        log('✓ hide() - Form submitted, hiding form...');
        el.hide();
        setTimeout(() => {
          el.show();
          log('✓ show() - Form shown again after 2s');
        }, 2000);
      }

      // Test: show/hide toggle
      function toggleVisibility(event, el) {
        const targetEl = document.getElementById('toggle-target');
        if (targetEl) {
          if (targetEl.style.display === 'none') {
            targetEl.show();
            log('✓ show() - Toggle target is now visible');
          } else {
            targetEl.hide();
            log('✓ hide() - Toggle target is now hidden');
          }
        }
      }

      // Test: setHTML
      function updateHTML(event, el) {
        const htmlEl = document.getElementById('html-display');
        if (htmlEl) {
          const count = parseInt(htmlEl.getAttribute('data-count') || '0') + 1;
          htmlEl.setAttribute('data-count', count);
          htmlEl.setHTML(
            `Updated <strong>${count}</strong> time${count !== 1 ? 's' : ''} with <em>setHTML()</em>`
          );
          log(`✓ setHTML() - Updated HTML content (count: ${count})`);
        }
      }

      // Test: addClass/removeClass toggle
      function toggleClass(event, el) {
        const targetEl = document.getElementById('class-target');
        if (targetEl) {
          if (targetEl.classList.contains('highlight')) {
            targetEl.removeClass('highlight');
            log("✓ removeClass('highlight') - Removed highlight class");
          } else {
            targetEl.addClass('highlight');
            log("✓ addClass('highlight') - Added highlight class");
          }
        }
      }

      // Phase 2: Reactive text bindings test handlers
      function incrementCount(event, el) {
        count++;
      }

      function decrementCount(event, el) {
        count--;
      }

      // Test: State declarations
      function testStateDeclarations(event, el) {
        log('✓ Testing state declarations...');
        log(`  - count: ${count} (type: ${typeof count})`);
        log(`  - message: "${message}" (type: ${typeof message})`);
        log(`  - score: ${score} (type: ${typeof score})`);
        log('✓ All state declarations are registered and accessible');
        
        // Update states to show reactivity
        count++;
        message = 'Updated at ' + new Date().toLocaleTimeString();
        score += 10;
        
        log('✓ State values updated - text bindings should update automatically');
      }

      // Initialize logging
      function initLog() {
        log('🚀 Phase 2 Event System & DOM Helpers Test Suite');
        log(
          'All DOM helper methods are ready: show(), hide(), addClass(), removeClass(), setText(), setHTML()'
        );
        log('🚀 Compiler: State Declarations');
        log('State declarations registered at compile time: count, message, score');
        
        // Display state declaration info
        const stateList = document.getElementById('state-list');
        if (stateList) {
          const states = [
            { name: 'count', value: count, type: typeof count },
            { name: 'message', value: message, type: typeof message },
            { name: 'score', value: score, type: typeof score }
          ];
          stateList.innerHTML = states.map(s => 
            `<li><code>state ${s.name} = ${JSON.stringify(s.value)}</code> (${s.type})</li>`
          ).join('');
        }
      }

      // State declarations - registered at compile time
      // These are processed by the compiler and removed from the output
      
      
      
    


// Phase 2 runtime helpers - DOM manipulation methods on HTMLElement prototype
HTMLElement.prototype.show = function() { this.style.display = "block"; }
HTMLElement.prototype.hide = function() { this.style.display = "none"; }
HTMLElement.prototype.addClass = function(name) { this.classList.add(name); }
HTMLElement.prototype.removeClass = function(name) { this.classList.remove(name); }
HTMLElement.prototype.setText = function(text) { this.textContent = text; }
HTMLElement.prototype.setHTML = function(html) { this.innerHTML = html; }

// Phase 2: Dynamic delegated event listener - single generic function for all event types
function delegate(event) {
  let type = event.type;
  let el = event.target;
  while (el && !el.hasAttribute(`data-zen-${type}`)) el = el.parentElement;
  const handlerName = el?.getAttribute(`data-zen-${type}`);
  if (handlerName && typeof window[handlerName] === "function") {
    window[handlerName](event, el);
  }
}

// Attach delegate function to all detected event types dynamically
const zenEvents = ["click","input","load","submit"];
zenEvents.forEach(type => {
  document.addEventListener(type, delegate);
});
