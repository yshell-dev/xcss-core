# Introduction

**XCSS** is a **Constraint-driven CSS-Build-time** which takes an opinionated diversions from vanilla CSS, while preserving the raw flexibility, additionally dependency resolution. 

- **Framework agnostic**
	Works with any text-based environment—no coupling to specific frameworks or tooling.
- **Design System Compatible**  
	Integrates cleanly with existing design systems, tokens, and component libraries—no rewrites, just augmentation.
- **Constraint-Based Syntax**
	Write styles within logical boundaries, enabling predictable behavior and modular reuse.
- **Native Dependency Management**
	Automatically resolves cascading order and inter-style dependencies, reducing manual overrides and conflicts.
- **Reusable Blocks**
	Compose styles as modular units that grow with your app—no tangled selectors or brittle overrides.
- **Production-Ready Optimization**
	Ships debloated, dependency-aware styles for faster, cleaner builds.

---
# Command Line

- `init`
	- Sets up the project by importing the configuration folder, and makes necessary changes to `configure.jsonc`.
	- If run inside an already initialized directory, it will create the necessary sub-folders as defined.

- `debug` : Compiles with full verbosity and traceability
	- Verbose output
	- Traceable class-names and properties.
	- Larger output size
	- Use `debug -w for live compilation with identical output.

- `preview` : Optimized compilation for lightweight builds:
	- Hashed class-names (≥ 3 characters)
	- Minified CSS.
	- Partial dependency resolution
	- Optimized for minimal class footprint
	- Use `preview -w` for live compilation.

- `publish {key}` : 
	- Requires a valid key and active internet connection
	- Executes only if no compilation errors are present
	- Falls back to the `preview` build if conditions aren't met
	- **Recommended for production-grade enterprise deployments**
# Setup folder
```
    xtyles/
    ├── libraries
	|   └── *
    ├── #at-rules.css
    ├── #constants.css
    ├── #elements.css
    ├── #extends.css
    ├── configure.jsonc
    ├── hashrules.jsonc
    └── vendors.jsonc
```

## `#at-rules.css`
- Defines preface directives for exported stylesheets.
- Declares preface-level directives for exported stylesheets, such as `@import`, `@layer`, `@charset`, `@font-face` etc.
## `#constants.css`
- Defines the core design tokens—colors, spacing, typography, and themes.
- Constants are context-aware and surfaced via LSP suggestions in valid scopes, enabling consistent styling.
---
> **Convention:**
> To prevent naming collisions and maintain clarity, all constants should follow the standard prefix format:  **`---{...}`**. This naming convention ensures safe resolution across files and avoids unintended conflicts in symbolic or dynamic contexts
---
## `#elements.css`
- Encourages semantic usage of tags by styling native tags directly.
- Offers classless CSS that dynamically adapts to the design system defined in `constants.css`, promoting minimal markup and clean semantics.
## `#extends.css`
- Augments the base CSS with additional declarations and overrides.
- Ideal for post-compilation definitions, utility extensions, and scoped enhancements that build on the compiled source stylesheet.
---
## `configure.jsonc`

```json
{
  "name": "",
  "version": "",
  "vendors": "none",
  "proxymap": [
    {
      "source": "src",
      "target": "xrc",
      "stylesheet": "styles.css",
      "extensions": {
        "html": [
          "class"
        ]
      }
    }
  ] 
}
```

- **`name`**  
    Artifact name used during composition.  
    If omitted, defaults to `../package.json::name`.
- **`version`**  
    Current version of the artifact.  
    If omitted, defaults to `../package.json::version`.
- **`vendors`**  
    Specifies vendor prefixing behavior.  
    Accepts `"none"` or a list of vendor targets (e.g., `"webkit"`, `"moz"`).
- **`proxymap`**  
    Defines proxy compilation behavior for source-to-target transformation.
	- **`source`**  
	    Path to the original source directory containing raw project files.
	- **`target`**  
	    Proxy output directory. Acts as a working compilation target for the source folder.
	- **`stylesheet`**  
	    Stylesheet appended to the final compiled output. Located within the target directory.
	- **`extensions`**  
	    Maps file types to attributes where symbolic classes will be injected.  
	    Example: `"html": ["class"]` targets HTML files and binds symbolic classes to the `class` attribute.
## `hashrules.jsonc`

```json
{
  "-DesignApproach": "#{-MobileFirst}",
  // Values for #DesignApproach
  "-MobileFirst": "min-width",
  "-DesktopFirst": "max-width",  
  // @media standards
  "Ms4": "media@(#{-DesignApproach}:0320px)",
  "Ms3": "media@(#{-DesignApproach}:0384px)",
  "Ms2": "media@(#{-DesignApproach}:0448px)",
  "Ms1": "media@(#{-DesignApproach}:0512px)",
  "Mmd": "media@(#{-DesignApproach}:0640px)",
  "Ml1": "media@(#{-DesignApproach}:0768px)",
  "Ml2": "media@(#{-DesignApproach}:0896px)",
  "Ml3": "media@(#{-DesignApproach}:1024px)",
  "Ml4": "media@(#{-DesignApproach}:1152px)",
  // @container standards
  "Cs4": "container@(#{-DesignApproach}:160px)",
  "Cs3": "container@(#{-DesignApproach}:192px)",
  "Cs2": "container@(#{-DesignApproach}:224px)",
  "Cs1": "container@(#{-DesignApproach}:256px)",
  "Cmd": "container@(#{-DesignApproach}:320px)",
  "Cl1": "container@(#{-DesignApproach}:384px)",
  "Cl2": "container@(#{-DesignApproach}:449px)",
  "Cl3": "container@(#{-DesignApproach}:512px)",
  "Cl4": "container@(#{-DesignApproach}:576px)",
  // Global States
  "Load": "body[data-loading='true']"
}
```

- `hashrules` define reusable **wrapper-attribute-snippets** as key-value pairs, where keys are restricted to characters: `A–Z`, `a–z`, `0–9`, and `-`.
-  Support **recursive loading**, enabling inheritance across definitions.
- To use a `hashrules` in a script, use the `#{___}` within **wrapper-attribute** of a tag. The `hashrule` will only take effect if the tag already includes a declared style.
- If a recursion loop is detected due to conflicting shorthand definitions, those entries will be ignored during compilation, with errors.
---
>For clarity and conflict avoidance, any `hashrule` used as a variable should begin with a **`-` prefix**.
---

## `vendors.jsonc`
- If `configure.jsonc | vendors: none` : Paste custom vendor data in this file
- If `configure.jsonc | vendors: {url}` has a valid URL source file will by automatically updated occasionally for vendor provider data.

## Libraries
### Naming Files
```
{cluster}.{order}.{name}.css
``` 

- `cluster` = `string[A-Z a-z 0-9 -]`
- `order` : `0|1|2`
- `name` : `string[A-Z a-z 0-9 -]`
### Derived Sym-classes
```
{cluster}{'$'*order}{Normalized(selector)}
```
#### Example
```css
/* anim.1.animation.css */
.none {
  transition: none;
}
.all {
  transition: all 300ms ease;
}
.transform {
  transition: transform 300ms ease;
}
.opacity {
  transition: opacity 300ms ease;
}
```

The classes defined in this file are accessed from other files using the following symbolic class references.
- `anim$none`
- `anim$all`
- `anim$transform`
- `anim$opacity`

### Inheritence Pattern: Types of Libraries

- `order` is the hierarchy level for library inheritance. Lower order files provide base/axiom styles; higher order files can reference and extend lower orders. Use `order` to control assignment (`@--assign`) and attachment (`@--attach`) visibility and override behavior.

#### Axiom
- `cluster` = `''`
- A special cluster without a cluster-name.
- In a file of **Order `n`**, symbolic classes may be referenced from other files using two distinct directives, with in the scope of `axiom` where permitted sources are:
	-  `@--assign`: Files of **Order ≤ n−1**
	-  `@--attach`: Files of **Order ≤ n**

#### Clusters
- Named clusters can access all symbolic classes from Axioms.
- In a file of **Order `n`**, symbolic classes may be referenced from other files using two distinct directives, with in the scope of whole `axiom` and `cluster` were permitted sources are:
	-  `@--assign`: Files of **Order ≤ n−1**
	-  `@--attach`: Files of **Order ≤ n**
# Quick-start Preview

## Input
- The following is fragmented preview of input to output compilation.

```html
<!doctype html>
<html lang="en">

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<!-- style -->
</head>
```
- `<!-- style -->`, a reserved comment tag, which will be replaced by compiled stylesheet.

```html
<body 
class="~bg$pattern =bg$pattern" 
bg$pattern="
	@--assign bg$pattern-checkerboard d-flex justify-center align-center;
	min-width: 100vw;
	min-height: 100vh;
"
{@media (min-width:512px)}&="
	--pattern-checker-bg1: var(---primary-100);
	--pattern-checker-bg2: var(---secondary-900);
"
>
```
- You can compose classes with in html tags with attribute representing **symbolic classes (symclasses)** `bg$pattern`.
- Attribute which ends with `&` is considered **wrappers** for the symbolic class.
- `=` using in **class attribute** will replace the symbolic class with proper hashed class. 
- `@--assign / =` can be used for initial compose of a symbolic class using **symclasses from libraries**. These will be hoisted to block scope and any explicit properties will easily override them. 

```html
	<staple glass$--container>
		<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
			<defs>
				<filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92"
						result="noise" />
					<feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
					<feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R"
						yChannelSelector="G" />
				</filter>
			</defs>
		</svg>
	</staple>
```
-  `<staple ... > ... </staple>` a special tag used to create a **dependency to text-block with a symclass**. The content with-in the tag will be only deployed if the corresponding symclass is used compiled CSS.

```html
	\<summon style="
		background-image: linear-gradient(#ffffff 0.9px, transparent 0.9px), linear-gradient(to right, #ffffff 0.9px, #cacaca 1px);
		background-size: 18px 18px;
	" 
	data-glass-type="frosted" 
	class="glass-type" 
	glass$$container="
		~ glass$--container;
		= p-24 m-0 border-0 radius-16 d-flex align-center justify-center position-fixed tx$decoration-none cursor-pointer bg$none tx$size-h1 isolate an$transition-all;
		box-shadow: 0px 6px 12px -6px #77777777;
		&:hover {
			= tf$scale-125;
		}
		&::after {
			= position-absolute inset-0 layer-neg-2 radius-16 tx$content-clear;
			filter: url(#glass-distortion);
		}
		&::before {
			= position-absolute inset-0 layer-neg-1 radius-16 tx$content-clear;
			box-shadow: inset 0 0 15px -5px #00000044;
		}
		&.glass-type {
			&[data-glass-type='frosted'] {
				&::after {
					backdrop-filter: blur(1px);
				}
				&::before {
					background-color: rgba(255, 255, 255, 0.6);
				}
			}
			&[data-glass-type='liquid'] {
				&::after {
					backdrop-filter: blur(.5px);
				}
				&::before {
					background-color: rgba(255, 255, 255, 0.25);
				}
			}
		}
	" 
	&="Use activation class `glass-type` for `[data-glass-type='liquid'|'frosted']` attribute"
	>Test</summon>
```
- `<summon ... > ... </summon>`, a special tag which lets you create portable template for component level **symclasses**, which can be used for preview in a live sand-boxed environment while using language server. 
- @--attach / ~` can be used to add a dependency attachment of a symbolic class. These will be used for dependency tracking.
- Use `&` attribute to write comment, which can be used multiple times in the same tag. 

```html
	<div data-glass-type='liquid' 
	class="=glass$$container"
	>
		Liquid Glass
	</div>
```
- Symbolic classes can  defined anywhere and used where-ever within the provided scope.

```html
	<!-- staple -->
</body>

</html>
```
- `<!-- staple -->` the custom self closing tag will be replaced with, staple content of tracked dependencies.
## Output
- At time of render the nested blocks are reorganized in following order.
	- Native properties.(define and use variables).
	- **Compound Selector** (define variables, use only global constants.)
	- Pseudo-classes. (define variables, use only global constants).
	- Pseudo-elements. (use variables and constants).
	- **Descendant Selector** (use variables and constants).
```html
<!doctype html>
<html lang="en">

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />

	<style>
		/* Initial at-rules */

		/* Global Constants, variables starting with {---} */

		/* Modified Native Tag styles */

		
		._8h {
			--pattern-checker-bg1: var(---tertiary-300, #e0e0e0);
			--pattern-checker-bg2: transparent;
			--pattern-checker-size: 40px;
			background: linear-gradient(45deg, var(--pattern-checker-bg1) 25%, var(--pattern-checker-bg2) 25%, var(--pattern-checker-bg2) 75%, var(--pattern-checker-bg1) 75%, var(--pattern-checker-bg1)), linear-gradient(45deg, var(--pattern-checker-bg1) 25%, var(--pattern-checker-bg2) 25%, var(--pattern-checker-bg2) 75%, var(--pattern-checker-bg1) 75%, var(--pattern-checker-bg1));
			background-size: var(--pattern-checker-size) var(--pattern-checker-size);
			background-position: 0 0, calc(var(--pattern-checker-size) / 2) calc(var(--pattern-checker-size) / 2);
			display: flex;
			justify-content: center;
			align-items: center;
			min-width: 100vw;
			min-height: 100vh;
		}

		._8i {
			padding: 6rem;
			margin: 0;
			border-width: 0;
			border-radius: 4rem;
			display: flex;
			align-items: center;
			justify-content: center;
			position: fixed;
			text-decoration: none;
			cursor: pointer;
			background: none;
			font-size: var(---font-size-h1);
			isolation: isolate;
			transition: all 300ms ease;
			box-shadow: 0px 6px 12px -6px #77777777;
		}

		._8i.glass-type[data-glass-type='frosted']::after {
			backdrop-filter: blur(1px);
		}

		._8i.glass-type[data-glass-type='frosted']::before {
			background-color: rgba(255, 255, 255, 0.6);
		}

		._8i.glass-type[data-glass-type='liquid']::after {
			backdrop-filter: blur(.5px);
		}

		._8i.glass-type[data-glass-type='liquid']::before {
			background-color: rgba(255, 255, 255, 0.25);
		}

		._8i:hover {
			transform: scale(1.25);
		}

		._8i::after {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: -2;
			border-radius: 4rem;
			content: "";
			filter: url(#glass-distortion);
		}

		._8i::before {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: -1;
			border-radius: 4rem;
			content: "";
			box-shadow: inset 0 0 15px -5px #00000044;
		}

		@media (min-width:512px) {
			._8h {
				--pattern-checker-bg1: var(---primary-100);
				--pattern-checker-bg2: var(---secondary-900);
			}
		}
	</style>
</head>

<body data-sveltekit-preload-data="hover" class="_8h">

	<div class="_8i glass-type" data-glass-type='liquid'>
		Liquid Glass
	</div>

	<div>
		<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
			<defs>
				<filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92"
						result="noise" />
					<feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
					<feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R"
						yChannelSelector="G" />
				</filter>
			</defs>
		</svg>
	</div>
</body>

</html>
```
# Syntax

## Symbolic-Class 

``` 
{cluster}{scope}{identifier}
```

- **`cluster`**: Collection of classes, or use '-' to delegate to open cluster. 
	- Available characters: `A-Z`, `a-z`, `0-9`, and `-`.
	- `"-"`  is only for delegating open cluster at declaration. It will be hidden in other cases.
- **`scope`**: Scope of access of declared styles
	- `$` | **Local:** with in the declared file.
	- `$$` | **Global:** across all valid files in target folders.
	- `$$$` | **Public:** Scoped globally. Exported as artifact for cross-project use.  
- `identifier`: Specific identifier within the cluster.
	- Available characters: `A-Z` `a-z` `0-9` and `-`.
#### Examples
- `-$button`
- `_$button-2`
- `animate$$fade-in`
- `animate$$$fade-out`
## Wrapper Attributes
- Each wrapper-attribute generates a corresponding wrapper element around the class, with selectors derived directly from the attribute name.
- Wrapper-attributes enable highly flexible conditional logic—styles can be scoped, toggled, or layered based on attribute presence or value.
- Responsive design breakpoints are implemented using wrapper-attributes, allowing layout and style shifts based on contextual constraints.
### Rule Specification
- Must terminate with an `&` token
- `hashrules` (`#{rule}`) are valid within these attributes.
- use `{...}` brackets for raw string formatting for not breaking at spaces.
- Within `identifier@{ ... }`, shorthand expressions map to style constraints:
	- `width>=` : `min-width:`
	- `width<=` : `max-width:`
	- `height>=` : `min-height:`
	- `height<=` : `max-height:` 
### Example
```html
\<div
	_$class
	#{Load}&="..."
	{@supports not (backdrop-filter: blur(1px))}&="..."
	container@{(max-width: 320px)}="...">			
	{Placeholder}
</div>
```
### Output
```css
.$class {}
body[data-loading] .$class {}
@supports not (backdrop-filter: blur(1px)) { 
	.$class {} 
}
@container (max-width: 320px) { 
	.$class {} 
}
```
## Special Stylesheet Directives
### `@--assign`
- Compose styles from predefined classes from libraries using its symbolic representation.
- Values derived from this action is overridden by explicit properties
### `@--attach`
- Creates dependency with other classes using its symbolic-class representation.
- Library classes have dependent-style and composable-style of same value.  
## Special Tags
- If a symbolic-class is found as attribute, the content between tags is considered bound to it.
- Paired tags are collapsed, and self closing tags are replaced with proper value while compiling.
### `<staple> ... </staple>`
- Unconditionally binds markup snippets to a symbolic class.
- Snippets are imported in minified form but remain unprocessed.
- Useful for direct association without transformation or validation.
---
>**Convention:** Declare using a **symbolic-class-name**, where the sequence `--` must immediately follow the final `$`.  **Example**: `staple$--class-name`
---
### `<summon> ... </summon>`
- Used to declare component-level styles and generate corresponding style templates.
- Primarily leveraged for standalone live previews and rapid deployments within the editor environment.
---
>**Convention:** Declare using a **symbolic-class-name**, where the sequence `-` must immediately follow the final `$`.  **Example**: `summon$-class-name`
---
### `<style> ... </style>` 
- This tag is considered special case, as it is an existing standard for writing  CSS content with in markup.
- If a symbolic-class is found as attribute, the content between tags is considered bound to it.
---
### `<staple />` / `<!-- staple -->`
- Acts as a placeholder for injecting attached `staple-snippets` into the compiled output.
---
### `<summon />` /  `<!-- summon -->`
- Intended for rapid prototyping.
- Used as a placeholder for deploying alongside `stylesheet` and `staple-snippets` in the compiled output.
- Not recommended for production use due to potential instability or lack of semantic clarity.

## Tag Operations
```HTML
<button class="=$button ~$animate$fade-in">Click Here</button>
```
- In **native tag attributes**, represents symbolic-class identifier.
	- `~` | Scattered Import : Prefer using it for atomic classes, cascade order may be unpredictable for long conditional chains.
	- `=` | Structured Import: Assigns value to placeholder while compiling.
## Style Operations
#### Usage in tags

- In **style blocks**, It functions as a symbolic operand, serving as a concise representation of designated special directives.
	- `=` = `@--assign`
	- `~` = `@--attach`
# Appendix


## Errors & diagnostics

- Build errors and diagnostics are emitted to the terminal and surfaced through the language server (LSP) for editor tooling.
- Running compilation in `watch` mode enables live diagnostics: errors and warnings are updated in the terminal as files change.

## Symbolic-class uniqueness rules

- Local symbolic-classes (single `$`) must be unique within the declaring file.
- Global symbolic-classes (`$$`) must be unique across the entire project workspace.
- Neither local nor global symbolic-classes should collide with symbolic-classes generated by libraries; library-derived symbolic-classes are considered a separate namespace and collisions will produce warnings or errors during compilation.

## Collision & resolution
- When a **sym-class name collision** is detected (local, global or library-derived), the conflicting definitions are ignored as a fallback for that compilation pass. The compiler will emit a diagnostic explaining the collision and which entries were skipped.
- Once the conflict is resolved in source (unique names or adjusted libraries), a subsequent build will rebuild the affected artifacts and include the previously skipped definitions.
## Proxymap behavior
- On `init`, if a `proxymap` entry specifies a `target` folder that does not exist, the `target` will be cloned from the `source` to create a working proxy folder.
- During compilation, the `target` (proxy) folder is used as the compilation source. The compiler reads the `target` files and writes compiled artifacts into the `source` folder; treat `target` as a local source copy watched by the tool.
## Dependency resolution
- Dependency resolution is automated. The compiler traverses the attachment tree for symbolic-class `@--attach`/`~` links and deploys all interconnected dependencies together after symbolic classes are composed.
- `staple` snippets are replaced with the `<staple />` placeholder at compile time; ensure your attached staple snippets are present where expected to avoid missing assets.
## Hashing Methodology
- Class names that start with an underscore (`_`) are reserved for compiler-generated identifiers.
- The hashing/name generation uses a continuous counter encoded in base62 (0-9, A-Z, a-z) to produce short, deterministic names, and uses different method in different builds commands. This approach ensures compact identifiers while remaining deterministic across runs when the input and library ordering are unchanged.
## Hoisting semantics
- Hoisting is a default behavior: assigned (`@--assign` / `=`) and attached (`@--attach` / `~`) styles are pulled toward the top during compilation. Variables are promoted to an even higher preface level.
- Under a single scope, a variable may only have a single effective value; later overrides declared in the same scope replace earlier ones during hoisting.
- Prefer declaring state-affecting variables in the base class declaration and rely on compound selectors to update variables.
## Miscellaneous
- Source maps are not provided. Because the tool operates on plain text files and is intentionally language-independent, there is no meaningful source-map mapping to generate for generic text inputs.
- Vendor prefixes and compatibility data are fetched from external sources at build or release time so the tool can adapt to platform changes without embedding large datasets.
- Rarely-used color palettes will be provided additional fall back to literal hex codes.
## Testing & validation (Local and CI)
- Recommendation: always run `xcss preview` in local dev and CI pipelines before attempting a `publish` command.
- `xcss publish {key}` will only succeed when the project compiles with zero errors.
- **Local smoke checks**: Run a preview build and inspect the generated stylesheet in your `proxymap.target` directory (for example `xrc/styles.css`) and ensure expected classes are present and not obviously empty.
- Automated validation can verify artifact presence, size, and absence of compilation errors, but cannot guarantee the UI looks correct. For visual verification consider adding a lightweight visual regression step (Chromatic, Percy, or a simple Puppeteer-based screenshot test) in a later pipeline.
## CI / CD and Publishing
- Automated builds should run a preview build by default and only execute a publish step when a valid publish key is available in the CI environment.
- Recommended secret name: `PUBLISH_KEY` (store this in your CI provider's secrets store).
- Local dev: run `xcss publish ${key}` only when you have an explicit key; otherwise use `xcss preview` during development.
### Security notes:
- Treat `PUBLISH_KEY` like any other secret. Do not hard-code it in repo files, use the CI provider's secret mechanism.
- The `publish` step requires network access and will only run if the compiler reports zero compilation errors.
### Publish command — internals
- **What `xcss publish {key}` collects**
	- An indexed snapshot of the resolved **class-list** and its dependency graph for the target artifact.
- **Optimization goals performed during publish** 
	- **Dead-code elimination:** classes and staple snippets that are not referenced (directly or transitively) by the resolved dependency graph are excluded from the published artifact.
	- **Redundancy minimization:** identical declarations across files or libraries are deduplicated where safe; library provenance is preserved so consumers can trace back to original sources.
	- **Minimal output size:** apply deterministic class merging, ordering, and the configured hashing rules to produce the smallest stable stylesheet that preserves behavior.
- **Safety and privacy**
	- The publish operation only transmits the indexed metadata and digests required to run server-side optimizations — it does not leak raw source files beyond what is necessary, and it omits any secrets or environment values.
	- The server will reject `publish` attempts if compilation errors exist locally. This prevents publishing incomplete or broken artifacts.
- **Fallbacks and retries**
	- If the remote publish fails (network, invalid key, server error), the client will report the failure and exit using `xcss preview` output as the deployable artifact.
## Runtime integration
- No runtime integration or API/plugins required
	- The compiler produces a static stylesheet artifact (for example `xrc/styles.css`) which can be included in your app like any other CSS file.
	- No bundler plugin, runtime library, or client-side loader is required to consume the generated stylesheet. Add it to your HTML, static assets, or bundler's asset pipeline as you would any plain CSS file.
## Extensibility & contributions
- The compiler binary is intentionally a closed distribution for runtime execution: contributions to the binary itself are not expected. The tool is a structural processor and does not validate or understand CSS properties or values — **it operates on document structure and symbolic classes**.
- Extending the system: users can add CSS files to the `xtyles/libraries` folder to create custom libraries/frameworks; the six-level inheritance model allows rapid propagation of changes across a project.
- Conditional definitions (media queries, custom at-rules, container-dependent variants, etc.) are generated using wrapper-attributes. `hashrules` provide reusable snippets for wrapper attributes.
