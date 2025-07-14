/**
 * @fileoverview
 * Dummy usage file to prevent tree-shaking of utility exports.
 *
 * This file imports and invokes the `translate` and `getFixedTranslation` functions
 * from the i18n utilities module. Its sole purpose is to ensure these functions
 * are preserved in the build output, even if they are not directly used elsewhere
 * in the core MO UI codebase.
 *
 * If you remove or rename this file, verify that i18n-related exports remain
 * accessible to external plugins via the shared API.
 */
import { translate, getFixedTranslation } from "./i18n"

translate("test")
const t = getFixedTranslation("en", "namespace", "prefix")
t("key", { count: 1 })
