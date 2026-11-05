import Button from '@/components/Button/Button'
import type { ActionItem } from '@/types'

const ActionButtonGrid = ({ actions }: { actions: ActionItem[] }) => (
  <div id="buttons" className="grid grid-cols-2 gap-2">
    {actions.map((action) => (
      <Button
        key={action.text}
        text={action.text}
        link={action.link}
        backgroundColor={action.backgroundColor ?? 'bg-primary'}
        clickFunction={null}
        disableLink={false}
      />
    ))}
  </div>
)

export default ActionButtonGrid
