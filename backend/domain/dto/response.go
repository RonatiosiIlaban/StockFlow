package dto

type Response[T any] struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    T           `json:"data"`
	Meta    interface{} `json:"meta,omitempty"`
}

func ResponseError(message string) Response[string] {
	return Response[string]{
		Code:    "99",
		Message: message,
		Data:    "",
	}
}

func ResponseErrorWithData(message string, data map[string]string) Response[map[string]string] {
	return Response[map[string]string]{
		Code:    "99",
		Message: message,
		Data:    data,
	}
}

func ResponseSuccess[T any, P any](data T, pagination P) Response[T] {
	return Response[T]{
		Code:    "00",
		Message: "success",
		Data:    data,
		Meta:    pagination,
	}
}

func CreateResponseSuccess[T any](data T) Response[T] {
	return Response[T]{
		Code:    "00",
		Message: "success",
		Data:    data,
	}
}
