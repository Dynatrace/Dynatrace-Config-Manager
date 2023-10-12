# Copyright 2023 Dynatrace LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#      https://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

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
