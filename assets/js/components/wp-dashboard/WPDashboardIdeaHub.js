/**
 * Idea Hub notice component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { useFeature } from '../../hooks/useFeature';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_IDEA_HUB } from '../../modules/idea-hub/datastore/constants';
import GoogleLogoIcon from '../../../svg/logo-g.svg';
import Link from '../Link';

const { useSelect } = Data;

function WPDashboardIdeaHub() {
	const isIdeaHubEnabled = useFeature( 'ideaHubModule' );

	const {
		hasSavedIdeas,
		isModuleActive,
		dashboardURL,
	} = useSelect( ( select ) => {
		if ( ! isIdeaHubEnabled ) {
			return {};
		}
		const savedIdeas = select( MODULES_IDEA_HUB ).getSavedIdeas();
		const adminURL = select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' );
		return {
			isModuleActive: select( CORE_MODULES ).isModuleActive( 'idea-hub' ),
			hasSavedIdeas: savedIdeas && savedIdeas.length,
			dashboardURL: `${ adminURL }#saved-ideas`,
		};
	} );

	const shouldRender = isModuleActive && hasSavedIdeas;
	const Component = (
		<div className="googlesitekit-idea-hub__wpdashboard--notice">
			<div className="googlesitekit-idea-hub__wpdashboard--header">
				<GoogleLogoIcon width="16" height="16" />
				<div className="googlesitekit-idea-hub__wpdashboard--title">
					{ __( 'Site Kit', 'google-site-kit' ) }
				</div>
			</div>

			<p className="googlesitekit-idea-hub__wpdashboard--link">
				<Link href={ dashboardURL }>
					{ __( 'Need some inspiration? Revisit your saved ideas in Site Kit', 'google-site-kit' ) }
				</Link>
			</p>

			<p className="googlesitekit-idea-hub__wpdashboard--link">
				<Link href={ dashboardURL }>
					{ __( 'View', 'google-site-kit' ) }
				</Link>
			</p>
		</div>
	);

	return shouldRender ? Component : null;
}

export default WPDashboardIdeaHub;
