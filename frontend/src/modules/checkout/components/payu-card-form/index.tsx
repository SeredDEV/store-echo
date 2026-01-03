"use client"

import { Label } from "@medusajs/ui"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import React, { useMemo, useState, useEffect } from "react"

type PayUCardFormProps = {
  onCardComplete?: (complete: boolean) => void
  onCardChange?: (cardData: any) => void
}

const PayUCardForm: React.FC<PayUCardFormProps> = ({
  onCardComplete,
  onCardChange,
}) => {
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")

  // Verificar si el formulario está completo cada vez que cambian los valores
  useEffect(() => {
    const complete =
      cardNumber.length >= 13 &&
      cardName.length > 0 &&
      expiryMonth.length === 2 &&
      expiryYear.length === 4 &&
      cvv.length >= 3

    console.log("🔵 PayU Card Form - complete:", complete, {
      cardNumber: cardNumber.length,
      cardName: cardName.length,
      expiryMonth: expiryMonth.length,
      expiryYear: expiryYear.length,
      cvv: cvv.length,
    })

    onCardComplete?.(complete)

    if (complete) {
      onCardChange?.({
        card_number: cardNumber.replace(/\s/g, ""),
        holder_name: cardName,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv: cvv,
      })
    }
  }, [cardNumber, cardName, expiryMonth, expiryYear, cvv, onCardComplete, onCardChange])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
      {/* Card Number */}
      <div>
        <Label htmlFor="card-number" className="text-sm font-medium">
          Número de tarjeta *
        </Label>
        <input
          id="card-number"
          type="text"
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          value={cardNumber}
          onChange={(e) => {
            const formatted = formatCardNumber(e.target.value)
            setCardNumber(formatted)
          }}
          className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Cardholder Name */}
      <div>
        <Label htmlFor="card-name" className="text-sm font-medium">
          Nombre del titular *
        </Label>
        <input
          id="card-name"
          type="text"
          placeholder="JUAN PEREZ"
          value={cardName}
          onChange={(e) => {
            setCardName(e.target.value.toUpperCase())
          }}
          className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Expiry and CVV */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expiry-month" className="text-sm font-medium">
            Mes *
          </Label>
          <input
            id="expiry-month"
            type="text"
            placeholder="MM"
            maxLength={2}
            value={expiryMonth}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "")
              if (
                value === "" ||
                (parseInt(value) >= 1 && parseInt(value) <= 12)
              ) {
                setExpiryMonth(value)
              }
            }}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="expiry-year" className="text-sm font-medium">
            Año *
          </Label>
          <input
            id="expiry-year"
            type="text"
            placeholder="YYYY"
            maxLength={4}
            value={expiryYear}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "")
              setExpiryYear(value)
            }}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="cvv" className="text-sm font-medium">
            CVV *
          </Label>
          <input
            id="cvv"
            type="text"
            placeholder="123"
            maxLength={4}
            value={cvv}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "")
              setCvv(value)
            }}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}

export default PayUCardForm
