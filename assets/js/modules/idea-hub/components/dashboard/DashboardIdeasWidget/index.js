/**
 * DashboardIdeasWidget component
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
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import { useHash, useMount } from 'react-use';
import { useInView } from 'react-intersection-observer';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	createInterpolateElement,
	useState,
	useEffect,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_IDEA_HUB,
	IDEA_HUB_GA_CATEGORY_WIDGET,
} from '../../../datastore/constants';
import { trackEvent } from '../../../../../util';
import whenActive from '../../../../../util/when-active';
import DashboardCTA from '../DashboardCTA';
import EmptyIcon from '../../../../../../svg/zero-state-yellow.svg';
import Badge from '../../../../../components/Badge';
import NewIdeas from './NewIdeas';
import SavedIdeas from './SavedIdeas';
import DraftIdeas from './DraftIdeas';
import Empty from './Empty';
import Footer from './Footer';
const { useSelect } = Data;

function getHash( hash ) {
	return hash ? hash.replace( '#', '' ) : false;
}

function isValidHash( hash ) {
	return getHash( hash ) in DashboardIdeasWidget.tabToIndex;
}

function getIdeaHubContainerOffset( widgetOffset ) {
	const header =
		document.querySelector( '.googlesitekit-header' )?.offsetHeight || 0;
	const adminBar = document.getElementById( 'wpadminbar' )?.offsetHeight || 0;
	const marginBottom = 24;
	const headerOffset = header + adminBar + marginBottom;

	return global.window.pageYOffset + widgetOffset - headerOffset;
}

function DashboardIdeasWidget( props ) {
	const { defaultActiveTabIndex, Widget, WidgetReportError } = props;

	const [ trackedWidgetView, setTrackedWidgetView ] = useState( false );

	const newIdeas = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getNewIdeas()
	);
	const savedIdeas = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getSavedIdeas()
	);
	const draftIdeas = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getDraftPostIdeas()
	);

	const [ hash, setHash ] = useHash();
	const [ activeTabIndex, setActiveTabIndex ] = useState(
		DashboardIdeasWidget.tabToIndex[ getHash( hash ) ] ||
			defaultActiveTabIndex
	);
	const activeTab = DashboardIdeasWidget.tabIDsByIndex[ activeTabIndex ];

	const [ ideaHubContainer, inView ] = useInView( {
		triggerOnce: true,
		threshold: 0.25,
	} );

	useEffect( () => {
		if ( inView ) {
			trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'widget_view' );
		}
	}, [ inView ] );

	let hasNoIdeas, hasManyIdeas;

	if (
		newIdeas?.length === 0 &&
		savedIdeas?.length === 0 &&
		draftIdeas?.length === 0
	) {
		hasNoIdeas = true;
	}

	if (
		newIdeas?.length > 0 ||
		savedIdeas?.length > 0 ||
		draftIdeas?.length > 0
	) {
		hasManyIdeas = true;
	}

	useEffect( () => {
		// Do nothing if the following events have already been tracked
		// or the widget hasn't appeared in the viewport yet.
		if ( trackedWidgetView || ! inView ) {
			return;
		}

		if ( hasNoIdeas ) {
			setTrackedWidgetView( true );

			trackEvent(
				IDEA_HUB_GA_CATEGORY_WIDGET,
				'widget_gathering_data_view'
			);
		} else if ( hasManyIdeas ) {
			setTrackedWidgetView( true );

			trackEvent(
				IDEA_HUB_GA_CATEGORY_WIDGET,
				'default_tab_view',
				DashboardIdeasWidget.tabIDsByIndex[ activeTabIndex ]
			);
		}
	}, [
		hasNoIdeas,
		hasManyIdeas,
		trackedWidgetView,
		setTrackedWidgetView,
		activeTabIndex,
		inView,
	] );

	useMount( () => {
		if ( ! ideaHubContainer?.current || ! isValidHash( hash ) ) {
			return;
		}

		setTimeout( () => {
			global.window.scrollTo( {
				top: getIdeaHubContainerOffset(
					ideaHubContainer.current.getBoundingClientRect().top
				),
				behavior: 'smooth',
			} );
		}, 1000 );
	} );

	const handleTabUpdate = useCallback(
		( tabIndex ) => {
			const slug = DashboardIdeasWidget.tabIDsByIndex[ tabIndex ];

			setActiveTabIndex( tabIndex );
			setHash( slug );

			trackEvent( IDEA_HUB_GA_CATEGORY_WIDGET, 'tab_select', slug );
		},
		[ setHash, setActiveTabIndex ]
	);

	if ( hasNoIdeas ) {
		return (
			<Widget noPadding>
				<div className="googlesitekit-idea-hub">
					<Empty
						Icon={ <EmptyIcon /> }
						title={ __(
							'Idea Hub is generating ideas',
							'google-site-kit'
						) }
					/>
				</div>
			</Widget>
		);
	}

	const tabIdeasMap = {
		'new-ideas': newIdeas,
		'saved-ideas': savedIdeas,
		'draft-ideas': draftIdeas,
	};
	// The footer should be hidden in zero-states, except for on the new ideas tab.
	// This is done using a special CSS class rather than conditionally
	// rendering the component to avoid a layout shift when changing tabs.
	const hideFooter =
		'new-ideas' !== activeTab && tabIdeasMap[ activeTab ]?.length === 0;

	return (
		<Widget
			className={ classnames( {
				'googlesitekit-widget--hidden-footer': hideFooter,
			} ) }
			Footer={ () => (
				<Footer
					tab={ activeTab }
					footerText={
						( activeTab === 'new-ideas' &&
							__(
								'Updated every 2-3 days',
								'google-site-kit'
							) ) ||
						undefined
					}
				/>
			) }
			noPadding
		>
			<div className="googlesitekit-idea-hub" ref={ ideaHubContainer }>
				<div className="googlesitekit-idea-hub__header">
					<h3 className="googlesitekit-idea-hub__title">
						{ __(
							'Ideas to write about based on unanswered searches',
							'google-site-kit'
						) }

						<Badge
							label={ __( 'Experimental', 'google-site-kit' ) }
						/>
					</h3>

					<TabBar
						activeIndex={ activeTabIndex }
						handleActiveIndexUpdate={ handleTabUpdate }
						className="googlesitekit-idea-hub__tabs"
					>
						<Tab focusOnActivate={ false }>
							{ __( 'New', 'google-site-kit' ) }
						</Tab>
						<Tab focusOnActivate={ false }>
							{ savedIdeas?.length >= 0 &&
								createInterpolateElement(
									sprintf(
										/* translators: %s: number of saved Idea Hub ideas */
										__(
											'Saved <span>(%s)</span>',
											'google-site-kit'
										),
										savedIdeas.length
									),
									{
										span: <span />,
									}
								) }
							{ savedIdeas?.length === undefined &&
								__( 'Saved', 'google-site-kit' ) }
						</Tab>
						<Tab focusOnActivate={ false }>
							{ draftIdeas?.length >= 0 &&
								createInterpolateElement(
									sprintf(
										/* translators: %s: number of draft Idea Hub ideas */
										__(
											'Drafts <span>(%s)</span>',
											'google-site-kit'
										),
										draftIdeas.length
									),
									{
										span: <span />,
									}
								) }
							{ draftIdeas?.length === undefined &&
								__( 'Drafts', 'google-site-kit' ) }
						</Tab>
					</TabBar>
				</div>

				<div className="googlesitekit-idea-hub__body">
					<div
						className="googlesitekit-idea-hub__content"
						aria-hidden={ activeTab !== 'new-ideas' }
					>
						<NewIdeas WidgetReportError={ WidgetReportError } />
					</div>

					<div
						className="googlesitekit-idea-hub__content"
						aria-hidden={ activeTab !== 'saved-ideas' }
					>
						<SavedIdeas WidgetReportError={ WidgetReportError } />
					</div>

					<div
						className="googlesitekit-idea-hub__content"
						aria-hidden={ activeTab !== 'draft-ideas' }
					>
						<DraftIdeas WidgetReportError={ WidgetReportError } />
					</div>
				</div>
			</div>
		</Widget>
	);
}

DashboardIdeasWidget.tabToIndex = {
	'new-ideas': 0,
	'saved-ideas': 1,
	'draft-ideas': 2,
};

DashboardIdeasWidget.tabIDsByIndex = Object.keys(
	DashboardIdeasWidget.tabToIndex
);

DashboardIdeasWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	defaultActiveTabIndex: PropTypes.number,
};

DashboardIdeasWidget.defaultProps = {
	defaultActiveTabIndex: 0,
};

export default whenActive( {
	moduleName: 'idea-hub',
	FallbackComponent: DashboardCTA,
} )( DashboardIdeasWidget );
