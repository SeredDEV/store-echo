"use client"

import { Button, Heading } from "@medusajs/ui"
import { useRouter } from "next/navigation"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  customer: HttpTypes.StoreCustomer | null
  countryCode: string
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, customer, countryCode }: SummaryProps) => {
  const router = useRouter()
  const step = getCheckoutStep(cart)

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!customer) {
      e.preventDefault()
      router.push(`/${countryCode}/account`)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={customer ? `/checkout?step=${step}` : `/${countryCode}/account`}
        data-testid="checkout-button"
        onClick={handleCheckoutClick}
      >
        <Button className="w-full h-10">
          {customer ? "Go to checkout" : "Sign in to checkout"}
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
