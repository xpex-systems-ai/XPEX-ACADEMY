'use client'
import { FileArchive, GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PlanBadge from '@components/Dashboard/Shared/PlanRestricted/PlanBadge'
import { PlanLevel } from '@services/plans/plans'
import { useOrg } from '@components/Contexts/OrgContext'

interface ImportTypeSelectorProps {
  onSelectType: (_type: 'scorm' | 'learnhouse') => void
  currentPlan: PlanLevel
}

function ImportTypeSelector({ onSelectType, currentPlan }: ImportTypeSelectorProps) {
  const { t } = useTranslation()
  const org = useOrg()
  const rf = org?.config?.config?.resolved_features
  const canUseScorm = rf?.scorm?.enabled === true

  return (
    <div className="min-w-[360px] py-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => onSelectType('learnhouse')}
          className="group flex flex-col items-center rounded-xl border-2 border-gray-200 bg-white p-6 transition-all duration-200 hover:border-black hover:shadow-lg"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 transition-colors group-hover:bg-cyan-100">
            <FileArchive size={28} className="text-cyan-600" />
          </div>
          <h3 className="mb-1 font-semibold text-gray-900">Pacote de curso</h3>
          <p className="text-center text-sm text-gray-500">Importe um arquivo de curso exportado anteriormente pela plataforma.</p>
        </button>

        <button
          onClick={() => canUseScorm && onSelectType('scorm')}
          disabled={!canUseScorm}
          className={`group flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200 ${
            canUseScorm
              ? 'border-gray-200 bg-white hover:border-black hover:shadow-lg cursor-pointer'
              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
            canUseScorm
              ? 'bg-orange-50 group-hover:bg-orange-100'
              : 'bg-gray-100'
          }`}>
            <GraduationCap size={28} className={canUseScorm ? 'text-orange-600' : 'text-gray-400'} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${canUseScorm ? 'text-gray-900' : 'text-gray-500'}`}>
              {t('courses.import.scorm_package')}
            </h3>
            <PlanBadge currentPlan={currentPlan} requiredPlan={(rf?.scorm?.required_plan || 'enterprise') as PlanLevel} size="sm" />
          </div>
          <p className={`text-sm text-center ${canUseScorm ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('courses.import.scorm_description')}
          </p>
        </button>
      </div>
    </div>
  )
}

export default ImportTypeSelector