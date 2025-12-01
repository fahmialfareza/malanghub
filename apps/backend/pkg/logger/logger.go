package logger

import (
	"log"
)

// Simple wrapper around the standard log package to keep usage consistent
func Info(v ...interface{}) {
	log.Println(v...)
}

func Error(v ...interface{}) {
	log.Println(v...)
}

func Fatal(v ...interface{}) {
	log.Fatalln(v...)
}
