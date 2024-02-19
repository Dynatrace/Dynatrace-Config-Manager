
export function getStdError(error) {
    const jsonMatch = `${error}`.match(/Body: (.*)/);

    if (jsonMatch && jsonMatch.length > 1) {
        const jsonBody = jsonMatch[1];

        // Parse the JSON
        try {
            const parsedJson = JSON.parse(jsonBody);
            if ('stderr' in parsedJson) {
                return parsedJson['stderr']
            }
        } catch (error2) {
            // pass
        }
    } else {
        // pass
    }

    return null
}
