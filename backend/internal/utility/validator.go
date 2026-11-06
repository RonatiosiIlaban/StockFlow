package utility

import "github.com/go-playground/validator/v10"

func Validate[T any](data T) map[string]string {
	err := validator.New().Struct(data)
	res := map[string]string{}
	if err != nil {
		for _, v := range err.(validator.ValidationErrors) {
			res[v.StructField()] = MessageValidationError(v.StructField(), v.Tag())
		}
	}
	return res
}

func MessageValidationError(field, tag string) string {
	switch tag {
	case "required":
		return field + " is required"
	case "min":
		return field + " must be at least " + tag + " characters long"
	case "max":
		return field + " must be at most " + tag + " characters long"
	default:
		return field + " is not valid"
	}
}
