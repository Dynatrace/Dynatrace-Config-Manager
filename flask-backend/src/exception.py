

class UIForwartException(Exception):
    pass


class RequestHeadersMissingError(UIForwartException):
    pass


class TokenNotAuthorized(UIForwartException):
    pass
