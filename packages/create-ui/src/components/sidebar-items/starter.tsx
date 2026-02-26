import { useState } from 'react'
import { FileBoxIcon, TrashIcon } from 'lucide-react'

import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  setProjectTemplate,
  useApplicationMode,
  useProjectTemplate,
  useRegistry,
} from '../../store/project'
import { loadRemoteTemplate } from '../../lib/api'
import { StartersCarousel } from '../starters-carousel'

export default function Template() {
  const [url, setUrl] = useState('')
  const [open, setOpen] = useState(false)

  const mode = useApplicationMode()

  const { projectTemplate } = useProjectTemplate()

  if (mode !== 'setup') {
    return null
  }

  async function onImport(registryUrl?: string) {
    const data = await loadRemoteTemplate(registryUrl || url)

    if ('error' in data) {
      toast.error('Failed to load template', {
        description: data.error,
      })
    } else {
      setProjectTemplate(data)
      setOpen(false)
    }
  }

  const registry = useRegistry()

  return (
    <>
      {projectTemplate?.banner && (
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-gray-300 rounded-lg shadow-xl shadow-gray-800">
            <img
              src={projectTemplate.banner}
              alt="Template Banner"
              className="w-40 max-w-full"
            />
          </div>
        </div>
      )}
      {projectTemplate?.name && (
        <div className="text-md mb-4">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => {
              setProjectTemplate(undefined)
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
          <span className="font-bold">Template: </span>
          {projectTemplate.name}
        </div>
      )}
      <div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setUrl('')
            setOpen(true)
          }}
        >
          <FileBoxIcon className="w-4 h-4" />
          Set Project Template
        </Button>
        <Dialog modal open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:min-w-[425px] sm:max-w-fit">
            <DialogHeader>
              <DialogTitle>Project Template URL or ID</DialogTitle>
            </DialogHeader>
            {(registry?.templates || registry?.starters) && (
              <div>
                <StartersCarousel onImport={(url) => onImport(url)} />
              </div>
            )}
            <div>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="ecommerce or https://github.com/myorg/myproject/template.json"
                className="min-w-lg w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onImport()
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => onImport()}>Load</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
