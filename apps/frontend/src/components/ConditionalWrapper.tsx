export const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: {
  condition: boolean
  wrapper: React.FC<{ children: React.ReactNode }>
  children: React.ReactNode
}) => {
  if (condition) {
    const Wrapper = wrapper
    return <Wrapper>{children}</Wrapper>
  }
  return children
}
