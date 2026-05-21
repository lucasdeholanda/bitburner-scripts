/**
 * Checks if a value is defined (not `undefined`).
 *
 * ⚠️ Note: This function **allows `null`**, meaning it returns `true` for `null`.
 *
 * @template T - The type of the value.
 * @param obj - The value to check.
 * @returns `true` if the value is not `undefined`, otherwise `false`.
 *
 * @example
 * isdef(null);        // true
 * isdef(undefined);   // false
 * isdef(42);          // true
 */
export function isdef<T>(obj: T | null | undefined): obj is T | null {
	return obj !== undefined;
}

/**
 * Returns the given value if it is defined (not `undefined`),
 * otherwise returns the provided fallback.
 *
 * ⚠️ `null` is considered valid here and will be returned if present.
 *
 * @template T - The type of the value.
 * @param obj - The value to check.
 * @param orElse - The fallback value if `obj` is `undefined`.
 * @returns The original value if defined, otherwise `orElse`.
 *
 * @example
 * ifdef(null, "fallback");        // null
 * ifdef(undefined, "fallback");   // "fallback"
 * ifdef(42, "fallback");          // 42
 */
export function ifdef<T>(obj: T | null | undefined, orElse: T | null): T | null {
	const isDefined = isdef(obj);
	return isDefined ? obj : orElse;
}

/**
 * Checks if a value is both defined and not `null`.
 *
 * This is a stricter check than `isdef()`.
 *
 * @template T - The type of the value.
 * @param obj - The value to check.
 * @returns `true` if the value is neither `null` nor `undefined`, otherwise `false`.
 *
 * @example
 * isset(null);        // false
 * isset(undefined);   // false
 * isset(42);          // true
 */
export function isset<T>(obj: T | null | undefined): obj is T {
	return obj !== undefined && obj !== null;
}

/**
 * Returns the given value if it is set (not `null` or `undefined`),
 * otherwise returns the provided fallback.
 *
 * @template T - The type of the value.
 * @param obj - The value to check.
 * @param orElse - The fallback value if `obj` is `null` or `undefined`.
 * @returns The original value if set, otherwise `orElse`.
 *
 * @example
 * ifset(null, "fallback");        // "fallback"
 * ifset(undefined, "fallback");   // "fallback"
 * ifset(42, "fallback");          // 42
 */
export function ifset<T>(obj: T | null | undefined, orElse: T): T {
	return isset(obj) ? obj : orElse;
}

/**
 * Returns the given array if it is set (not `null` or `undefined`)
 * and not empty, otherwise returns the provided fallback array.
 *
 * @template T - The array element type.
 * @param obj - The array to check.
 * @param orElse - The fallback array if `obj` is empty, `null`, or `undefined`.
 * @returns The original array if non-empty and set, otherwise `orElse`.
 *
 * @example
 * ifNotEmptyish([], ["fallback"]);        // ["fallback"]
 * ifNotEmptyish(null, ["fallback"]);      // ["fallback"]
 * ifNotEmptyish([1, 2, 3], ["fallback"]); // [1, 2, 3]
 */
export function ifNotEmptyish<T>(obj: Array<T> | null | undefined, orElse: Array<T>): Array<T> {
	return isset(obj) && obj.length > 0 ? obj : orElse;
}

/**
 * Returns the given string if it contains non-whitespace characters,
 * otherwise returns a fallback value.
 *
 * @param obj - The string to check.
 * @param orElse - The fallback string to return if `obj` is blank or contains only whitespace.
 * @returns The original string if it has non-whitespace characters, otherwise the fallback.
 *
 * @example```ts
 * ifNotBlank("hello", "default");  // "hello"
 * ifNotBlank("   ", "default");    // "default"
 * ifNotBlank("", "default");       // "default"
 * ```
 */
export function ifNotBlank(obj: string, orElse: string): string {
	return obj.trim().length > 0 ? obj : orElse;
}