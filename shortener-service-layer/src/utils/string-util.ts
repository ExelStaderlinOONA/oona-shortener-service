export const isEmpty = (value: string): boolean => {
    if (value === null || value === '') {
        return true;
    }
    return false;
};

export const isNotEmpty = (value: string): boolean => {
    if (value != null || value != '') {
        return true;
    }
    return false;
};
