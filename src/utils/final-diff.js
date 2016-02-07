import is from './is';

export default function finalDiff(paramsDiff, queryParamsDiff) {
    if (is(paramsDiff, 'Null') && is(queryParamsDiff, 'Null')) {
        return null;
    }
    return {
        params: paramsDiff,
        queryParams: queryParamsDiff,
    };
}
