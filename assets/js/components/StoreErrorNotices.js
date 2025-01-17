/**
 * StoreErrorNotices component.
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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ErrorNotice from './ErrorNotice';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { isInsufficientPermissionsError } from '../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../util/insufficient-permissions-error-description';
const { useSelect } = Data;

export default function StoreErrorNotices( {
	moduleSlug,
	storeName,
	shouldDisplayError,
} ) {
	const errors = useSelect( ( select ) => select( storeName ).getErrors() );
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	return errors
		.map( ( error ) => {
			if ( isInsufficientPermissionsError( error ) ) {
				error = {
					...error,
					message: getInsufficientPermissionsErrorDescription(
						error.message,
						module
					),
				};
			}
			return error;
		} )
		.map( ( error, key ) => (
			<ErrorNotice
				key={ key }
				error={ error }
				shouldDisplayError={ shouldDisplayError }
			/>
		) );
}

StoreErrorNotices.propTypes = {
	storeName: PropTypes.string.isRequired,
	shouldDisplayError: PropTypes.func,
	moduleSlug: PropTypes.string,
};
