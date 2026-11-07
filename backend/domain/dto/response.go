package dto

import "fmt"

type Response[T any] struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    T           `json:"data"`
	Meta    interface{} `json:"meta,omitempty"`
}

func ResponseError(message string, statusCode int) Response[string] {
	return Response[string]{
		Code:    fmt.Sprintf("%02d", statusCode),
		Message: message,
		Data:    "",
	}
}

func ResponseErrorWithData(message string, data map[string]string, statusCode int) Response[map[string]string] {
	return Response[map[string]string]{
		Code:    fmt.Sprintf("%02d", statusCode),
		Message: message,
		Data:    data,
	}
}

func ResponseSuccess[T any, P any, s int](data T, pagination P, statusCode int) Response[T] {
	return Response[T]{
		Code:    fmt.Sprintf("%02d", statusCode),
		Message: "Success",
		Data:    data,
		Meta:    pagination,
	}
}

func CreateResponseSuccess[T any](data T, message string, statusCode int) Response[T] {
	return Response[T]{
		Code:    fmt.Sprintf("%02d", statusCode),
		Message: message,
		Data:    data,
	}
}
