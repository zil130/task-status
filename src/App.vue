<template>
  <v-app>
    <v-app-bar color="blue-lighten-4">
      <v-app-bar-title>
        <h4 class="text-h4">
          Текущий статус задач, созданных {{ period.fromDate === period.toDate
            ? `${period.fromDate}`
            : `с ${period.fromDate} по ${period.toDate}` }}
        </h4>
        <button
          :disabled="isLoading"
          @click="getTasks(dates)"
        >Обновить данные</button>
      </v-app-bar-title>
    </v-app-bar>
    <v-main>
      <div class="d-flex justify-space-between">
        <div class="d-flex align-center w-25">
          <vue-date-picker
            class="w-75"
            placeholder="Выберите период"
            locale="ru"
            cancelText="Отмена"
            selectText="Выбрать"
            range
            :readonly="isLoading"
            :enable-time-picker="false"
            :format="formatDatePicker"
            v-model="date"
            @update:model-value="handleDate"
          ></vue-date-picker>
        </div>
        <div class="w-25">
          <v-select
            class="w-75"
            label="Статус"
            variant="underlined"
            :items="currentStatuses"
            v-model="selectedStatus"
          ></v-select>
        </div>
        <div class="w-25">
          <v-select
            class="w-75"
            label="Ответственный"
            variant="underlined"
            :items="currentResponsible"
            v-model="selectedResponsible"
          ></v-select>
        </div>
        <div class="w-25">
          <v-select
            class="w-75"
            label="Постановщик"
            variant="underlined"
            :items="currentCreators"
            v-model="selectedCreator"
          ></v-select>
        </div>
      </div>
      <div
        v-if="isLoading"
      >
        Идёт загрузка данных
      </div>
      <div
        v-else-if="isError"
      >
        Произошла ошибка при запросе данных
      </div>
      <div
        v-else-if="!hasData"
      >
        Нет задач, созданных в выбранном периоде
      </div>
      <v-data-table
        v-else
        :items="filteredTasks"
        :headers="headers"
        :items-per-page="5"
        :items-per-page-text="'Строк на странице'"
        :no-data-text="'Нет данных, доступных по выбранным фильтрам'"
      ></v-data-table>
    </v-main>
  </v-app>
</template>

<script>
import bx24 from '@/utils/bx24';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

export default {
  components: { VueDatePicker },
  name: 'App',
  data() {
    return {
      headers: [
        {
          title: 'Задача', align: 'center', sortable: false, key: 'title',
        },
        {
          title: 'Статус', align: 'center', sortable: false, key: 'status',
        },
        {
          title: 'Дата создания', align: 'center', sortable: false, key: 'createdDate',
        },
        {
          title: 'Дата завершения', align: 'center', sortable: false, key: 'closedDate',
        },
        {
          title: 'Ответственный', align: 'center', sortable: false, key: 'responsibleName',
        },
        {
          title: 'Постановщик', align: 'center', sortable: false, key: 'creatorName',
        },
        {
          title: 'Дней с последнего комментария', align: 'center', sortable: false, key: 'lastCommentDays',
        },
        {
          title: 'Дата последнего комментария', align: 'center', sortable: false, key: 'lastCommentDate',
        },
        {
          title: 'Автор последнего комментария', align: 'center', sortable: false, key: 'lastCommentAuthor',
        },
      ],
      statuses: {
        2: 'Ждет выполнения',
        3: 'Выполняется',
        4: 'Ожидает контроля',
        5: 'Завершена',
        6: 'Отложена',
      },
      dates: {
        fromDate: this.getMondayOfWeek().toDateString(),
        toDate: this.addOneDay(new Date()).toDateString(),
      },
      period: {
        fromDate: this.formatDateToYYYYMMDD(this.getMondayOfWeek()),
        toDate: this.formatDateToYYYYMMDD(new Date()),
      },
      date: null,
      selectedStatus: 'Все',
      selectedResponsible: 'Все',
      selectedCreator: 'Все',
      currentStatuses: [],
      currentResponsible: [],
      currentCreators: [],
      tasks: [],
      isLoading: false,
      hasData: false,
      isError: false,
    };
  },
  methods: {
    formatDatePicker() {
      return this.period.fromDate === this.period.toDate
        ? `${this.period.fromDate}`
        : `${this.period.fromDate}-${this.period.toDate}`;
    },
    addOneDay(date) {
      const result = new Date(date);
      result.setDate(result.getDate() + 1);

      return result;
    },
    formatDateToYYYYMMDD(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${day}.${month}.${year}`;
    },
    handleDate(modelData) {
      if (modelData) {
        this.tasks = [];
        const [fromDate, toDate] = modelData;
        this.dates.fromDate = fromDate.toDateString();
        this.dates.toDate = toDate
          ? this.addOneDay(toDate).toDateString()
          : this.addOneDay(fromDate).toDateString();
        this.period.fromDate = this.formatDateToYYYYMMDD(fromDate);
        this.period.toDate = toDate
          ? this.formatDateToYYYYMMDD(toDate)
          : this.formatDateToYYYYMMDD(fromDate);
        this.getTasks(this.dates);
      }
    },
    async getTasks({ fromDate, toDate }) {
      this.isError = false;
      this.isLoading = true;
      this.hasData = false;
      this.selectedStatus = 'Все';
      this.selectedResponsible = 'Все';
      this.selectedCreator = 'Все';
      this.currentStatuses = [];
      this.currentResponsible = [];
      this.currentCreators = [];

      try {
        const tasksList = await bx24.getAll('tasks.task.list', {
          filter: {
            '>CREATED_DATE': fromDate,
            '<CREATED_DATE': toDate,
          },
        });

        const commentPromises = tasksList.map(async (task) => {
          const response = await bx24.callMethod('task.commentitem.getlist', { TASKID: task.id });

          return { ...task, comments: response.result };
        });

        const updatedTasks = await Promise.all(commentPromises);

        this.hasData = updatedTasks.length > 0;
        this.tasks = updatedTasks;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Ошибка: ', e);
        this.isError = true;
      } finally {
        this.isLoading = false;
      }
    },
    getMondayOfWeek() {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

      return new Date(today.getFullYear(), today.getMonth(), diff);
    },
    getDaysAfterLastComment(dateLastComment) {
      const commentDate = new Date(dateLastComment);
      const todayDate = new Date();
      commentDate.setHours(0, 0, 0, 0);
      todayDate.setHours(0, 0, 0, 0);
      const timeDiff = todayDate - commentDate;

      return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    },
  },
  mounted() {
    this.getTasks(this.dates);
  },
  computed: {
    filteredTasks() {
      let filteredTasks = this.tasks.map((task) => ({
        title: task?.title ?? '',
        status: this.statuses[task?.status] ?? '',
        createdDate: task?.createdDate?.substring(0, 10) ?? '',
        closedDate: task?.closedDate?.substring(0, 10) ?? '',
        responsibleName: task?.responsible?.name ?? '',
        creatorName: task?.creator?.name ?? '',
        lastCommentDays: task?.comments[task.comments.length - 1]?.POST_DATE
          ? this.getDaysAfterLastComment(task.comments[task.comments.length - 1].POST_DATE)
          : '',
        lastCommentDate: task?.comments[task.comments.length - 1]?.POST_DATE?.substring(0, 10) ?? '',
        lastCommentAuthor: task?.comments[task.comments.length - 1]?.AUTHOR_NAME ?? '',
      }));

      if (this.selectedStatus !== 'Все') {
        filteredTasks = filteredTasks
          .filter((task) => task.status === this.selectedStatus);
      }

      if (this.selectedResponsible !== 'Все') {
        filteredTasks = filteredTasks
          .filter((task) => task.responsibleName === this.selectedResponsible);
      }

      if (this.selectedCreator !== 'Все') {
        filteredTasks = filteredTasks
          .filter((task) => task.creatorName === this.selectedCreator);
      }

      return filteredTasks;
    },
  },
  watch: {
    tasks(newValue) {
      const statuses = newValue.map(({ status }) => this.statuses[status]);
      const responsible = newValue.map((task) => task?.responsible?.name);
      const creators = newValue.map((task) => task?.creator?.name);

      this.currentStatuses = ['Все', ...new Set(statuses)];
      this.currentResponsible = ['Все', ...new Set(responsible)];
      this.currentCreators = ['Все', ...new Set(creators)];
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 30px;
}
</style>
