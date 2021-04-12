<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\ManagePosts
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

/**
 * Adds SwG column to Manage Posts page.
 */
final class ManagePosts {

	/** Adds WordPress filters. */
	public function __construct() {
		add_filter( 'manage_posts_columns', array( __CLASS__, 'manage_posts_columns' ) );
		add_action( 'manage_posts_custom_column', array( __CLASS__, 'manage_posts_custom_column' ), 1, 2 );
	}

	/**
	 * Filters manage posts columns.
	 *
	 * @param string[] $columns Columns to filter.
	 * @return string[]
	 */
	public static function manage_posts_columns( $columns ) {
		// Only add the column on post-type overview pages.
		// Without this check, the column appears on the AMP plugin's
		// Validated URLs page, for example.
		if ( get_current_screen()->parent_file === 'edit.php' ) {
			$columns['swg_product'] = '<span title="Reader revenue product">Product</span>';
		}

		return $columns;
	}

	/**
	 * Renders content for custom columns.
	 *
	 * @param string $column_name Current column name.
	 * @param number $post_ID Current post ID.
	 */
	public static function manage_posts_custom_column( $column_name, $post_ID ) {
		if ( 'swg_product' === $column_name ) {
			$product_key = Key::from( 'product' );
			$product     = get_post_meta( $post_ID, $product_key, true );

			$free_key = Key::from( 'free' );
			$free     = get_post_meta( $post_ID, $free_key, true );

			if ( $product ) {
				if ( 'true' === $free ) {
					echo 'Free';
				} else {
					echo esc_attr( $product );
				}
			}
		}
	}
}
