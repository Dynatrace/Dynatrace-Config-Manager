

class UIForwartException(Exception):
    pass


class RequestHeadersMissingError(UIForwartException):
    pass


class TokenNotAuthorized(UIForwartException):
    pass



class AggregateExceptions(Exception):
    pass

class SettingsValidationError(AggregateExceptions):
    pass
