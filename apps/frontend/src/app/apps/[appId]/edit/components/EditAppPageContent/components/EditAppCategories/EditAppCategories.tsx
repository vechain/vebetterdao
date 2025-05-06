import { UseFormReturn } from "react-hook-form"
import { EditAppForm } from "../../EditAppPageContent"
import { CategorySelector } from "@/components/CategorySelector"

type EditAppCategoriesProps = {
  form: UseFormReturn<EditAppForm>
}

export const EditAppCategories = ({ form }: EditAppCategoriesProps) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <CategorySelector
      fieldName="categories"
      register={register}
      setValue={setValue}
      watch={watch}
      error={errors.categories?.message}
    />
  )
}
