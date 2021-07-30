const storybookHost = require( './detect-storybook-host' );
const rootURL = `${ storybookHost }iframe.html?id=`;
const storybookStories = require( '../../.storybook/storybook-data' );
// does not work as these paths are relative to this file
// const filePaths = require( '../../.storybook/main' );
const glob = require( 'glob' );
const fs = require( 'fs' );
const parser = require( '@babel/parser' );
const traverse = require( '@babel/traverse' ).default;
const csf = require( '@componentdriven/csf' );

const camelCaseToKebabCase = ( string ) => string
	.replace( /([a-z0-9])([A-Z])/g, '$1-$2' )
	.replace( /([A-Z])([A-Z])(?=[a-z])/g, '$1-$2' )
	.toLowerCase();

// TEMP FIX HARDCODE PATHS HERE
const storyFiles = glob.sync( './assets/js/**/*.stories.js' );
storyFiles.forEach( ( storyFile ) => {
	const code = fs.readFileSync( storyFile ).toString();
	const ast = parser.parse( code, { sourceType: 'module', plugins: [ 'jsx' ] } );

	const stories = {};
	let defaultTitle = '';
	let defaultComponent = '';

	traverse( ast, {
		ExportDefaultDeclaration: ( { node } ) => {
			const properties = {};
			node.declaration.properties.forEach( ( property ) => {
				properties[ property.key.name ] = property.value.value || property.value.name;
			} );

			defaultTitle = ( properties && properties.title ) || '';
			defaultComponent = ( properties && properties.component ) || '';
		},
		AssignmentExpression: ( { node } ) => {
			let nodeValue = '';
			if ( node.right.type === 'StringLiteral' && node.left.property.name === 'storyName' ) {
				nodeValue = node.right.value;
			} else if ( node.right.type === 'ObjectExpression' ) {
				nodeValue = {};
				node.right.properties.forEach( ( property ) => {
					nodeValue[ property.key.name ] = property.value.value;
				} );
			}

			// console.log( 'node.left.object.name ', node.left.object.name );
			// console.log( 'node.left.property.name ', node.left.property.name );

			if ( ! stories[ node.left.object.name ] ) {
				stories[ node.left.object.name ] = {};
			}

			stories[ node.left.object.name ][ node.left.property.name ] = nodeValue;
		},
	} );

	// console.log( 'stories: ', stories );

	// Export to storybook compatible stories.json format.
	const finalStories = {};

	// console.log( 'stories ', stories );

	for ( const [ key, value ] of Object.entries( stories ) ) {
		// this is wrong. should be component
		// const storyID = csf.toId( defaultTitle, value.storyName ); // eslint-disable-line

		const storyID = csf.toId( defaultTitle, camelCaseToKebabCase(key) ); // eslint-disable-line

		finalStories[ storyID ] = { ...value };
		finalStories[ storyID ].key = key;
		finalStories[ storyID ].id = storyID;
		finalStories[ storyID ].name = value.storyName;
		finalStories[ storyID ].kind = defaultTitle;
		finalStories[ storyID ].story = value.storyName;
		finalStories[ storyID ].scenarios = value.scenario || {};
		finalStories[ storyID ].component = defaultComponent;
		finalStories[ storyID ].parameters = {
			__id: storyID,
		};
		if ( finalStories[ storyID ].args ) {
			finalStories[ storyID ].parameters.__isArgsStory = true;
		}

		if ( value && value.scenario && Object.keys( value.scenario ).length > 0 && value.scenario && value.scenario.constructor === Object ) {
			console.log( 'value.scenario', value.scenario ); // eslint-disable-line

			const newStory = {
				id: storyID,
				// this is wrong... how is it Global in config? hmmmm
				kind: value.scenario.kind || defaultTitle,
				// has unique name in config. I would have thought scenario should override this, with parameters as a sub key
				name: value.scenario.name || value.storyName,
				// Don't see this as correct from snippet
				// story: 'VRT Story',
				// in config it is always the same
				story: value.scenario.story || value.storyName,
				parameters: {
					fileName: storyFile,
					options: {
						// would be better to spread?
						// ...value.scenario,
						// why is hierarchySeparator undefined here? presume only supports serializable values?
						hierarchySeparator: value.scenario.hierarchySeparator || {},
						hierarchyRootSeparator: value.scenario.hierarchyRootSeparator,
						readySelector: value.scenario.readySelector,
					},
				},
			};

			// can see this working
			console.log( 'STORY ADDED', newStory ); // eslint-disable-line

			// Merge storybook stories
			storybookStories.push( newStory );
		}
	}

	return finalStories;
} );

module.exports = storybookStories.map( ( story ) => {
	return {
		label: `${ story.kind }/${ story.name }`,
		url: `${ rootURL }${ story.id }`,
		readySelector: story.parameters.options.readySelector,
		hoverSelector: story.parameters.options.hoverSelector,
		clickSelector: story.parameters.options.clickSelector,
		clickSelectors: story.parameters.options.clickSelectors,
		postInteractionWait: story.parameters.options.postInteractionWait,
		delay: story.parameters.options.delay,
		onReadyScript: story.parameters.options.onReadyScript,
		misMatchThreshold: story.parameters.options.misMatchThreshold,
	};
} );

// module.exports = [];
