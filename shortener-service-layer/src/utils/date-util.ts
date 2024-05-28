import { BadRequestError } from 'src/exceptions/error-exception';

// Regex pattern for dd/MM/yyyy format  -> 23/11/2024
const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/([0][1-9]|[1][0-2])\/\d{4}$/;

export const formatStringToDate = (dateString: string): Date => {
    // Check if the date string matches the expected format
    if (!dateRegex.test(dateString)) {
        throw new BadRequestError('Invalid date string format. The correct format should be: dd/MM/yyyy');
    }
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
};

export const formatDateToString = (date: Date | null): string | null => {
    if (date != null) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${day}/${month}/${year}`;
        console.log(dateString); // Output: "23/11/2024"
        return dateString;
    }
    return null;
};
