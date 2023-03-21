

class UIForwartException(Exception):
    pass


class RequestHeadersMissingError(UIForwartException):
    pass


class TokenNotAuthorized(UIForwartException):
    pass



class AggregateExceptions(Exception):
    pass

class SettingsValidationError(AggregateExceptions):
    def __init__(self, response_text, message):
        self.response_text = response_text
        self.message = message
        super().__init__(self.message)
    pass
