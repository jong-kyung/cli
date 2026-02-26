import { useRegistry } from '../store/project'

import { Carousel, CarouselContent, CarouselItem } from './ui/carousel'

export function StartersCarousel({
  onImport,
}: {
  onImport: (url: string) => void
}) {
  const registry = useRegistry()

  if (!registry) {
    return null
  }

  const templates = registry.templates || registry.starters || []

  return (
    <div>
      <Carousel>
        <CarouselContent>
          {templates.map((template) => (
            <CarouselItem className="basis-1/3" key={template.url}>
              <div
                className="p-2 flex flex-col items-center hover:cursor-pointer hover:bg-gray-700/50 hover:text-white rounded-lg"
                onClick={() => {
                  onImport(template.url)
                }}
              >
                <img
                  src={template.banner}
                  alt={template.name}
                  className="w-100 max-w-full"
                />
                <div className="text-md font-bold">{template.name}</div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
