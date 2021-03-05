/**
 * Widgets combination utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import isEqual from 'lodash/isEqual';

function stateAndRowMatch( stateA, stateB, rowA, rowB ) {
	return rowA === rowB && isEqual( stateA, stateB );
}

/**
 * Combines consecutive widgets with similar states within the same row.
 *
 * @since 1.25.0
 *
 * @param {Array.<Object>} activeWidgets       List of active widgets.
 * @param {Object}         widgetStates        Map of widget slug and their
 *                                             state (either an object with
 *                                             `Component` and `metadata`, or
 *                                             `null`).
 * @param {Object}         layout              Layout arguments from
 *                                             	`getWidgetLayout()`.
 * @param {Array.<number>} layout.columnWidths List of column widths for each
 *                                             widget.
 * @param {Array.<number>} layout.rowIndexes   List of row indexes for each
 *                                             widget.
 * @return {Object} Object with `overrideComponents` property, both of which are a
 * 									list with one item for each widget. Every `overrideComponents`
 * 									entry is either an object with `Component` and `metadata`, or
 * 									`null` (similar to the `widgetStates` parameter).
 */
export function combineWidgets( activeWidgets, widgetStates, {
	columnWidths,
	rowIndexes,
} ) {
	const overrideComponents = [];

	let currentState = null;
	let currentRowIndex = -1;
	let columnWidthsBuffer = [];

	activeWidgets.forEach( ( widget, i ) => {
		overrideComponents.push( null );

		currentState = widgetStates[ widget.slug ];
		currentRowIndex = rowIndexes[ i ];

		// If the current widget has a special state...
		if ( currentState ) {
			if ( stateAndRowMatch( currentState, widgetStates[ activeWidgets[ i + 1 ]?.slug ], currentRowIndex, rowIndexes[ i + 1 ] ) ) {
				// If the current widget state and row index match the next
				// state and row index, hide the widget entirely. Only the last
				// similar instance will be rendered in this case.
				columnWidthsBuffer.push( columnWidths[ i ] );
			} else if ( columnWidthsBuffer.length > 0 ) {
				// If the state and row index do not match the next ones and
				// there are already similar instances (from previous
				// iterations), this is the last similar instance, so the
				// combined version will need to be displayed instead of the
				// widget. The combined version will use the common Component
				// and pass all common metadata as props.
				columnWidthsBuffer.push( columnWidths[ i ] );

				overrideComponents[ i ] = currentState;

				// Reset the columnWidthsBuffer variable.
				columnWidthsBuffer = [];
			}
		}
	} );

	return {
		overrideComponents,
	};
}
