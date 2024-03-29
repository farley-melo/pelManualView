import {Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {Formula} from '../../entidades/Formula';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Tanque} from '../../entidades/tanque';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {AutoCalcularLightSemLactoseService} from './calculoAutomatico/auto-calcular-light-sem-lactose.service';
import {AutoCalcularLightComLactoseService} from './calculoAutomatico/auto-calcular-light-com-lactose.service';
import {AutoCalcular46SemLactoseService} from './calculoAutomatico/auto-calcular-4-6-sem-lactose.service';
import {AutoCalcular8SemLactoseService} from './calculoAutomatico/auto-calcular-8-sem-lactose.service';
import {AutoCalcular46ComLactoseService} from './calculoAutomatico/auto-calcular-4-6-com-lactose.service';
import {AutoCalcular8ComLactoseService} from './calculoAutomatico/auto-calcular-8-com-lactose.service';


@Component({
  selector: 'app-simulador-partidas',
  templateUrl: './simulador-partidas.component.html',
  styleUrls: ['./simulador-partidas.component.css']
})
export class SimuladorPartidasComponent implements OnInit, OnDestroy {
  formularioEstatisticoPartida: FormGroup;
  formularioValoresInputados: FormGroup;
  formularioTotalPartidaTotalEsperado: FormGroup;
  formularioVariaves: FormGroup;
  listaDeFormulas: Formula[] = [];
  listaDeTanques: Tanque[];
  @ViewChild('quantidadeInput') quantidadeInput: ElementRef;
  inscricao: Subscription;
  modalRef: BsModalRef;
  @ViewChild('template', {static: false}) template: TemplateRef<any>;
  @ViewChild('materiaPrimaModal', {static: false}) materiaPrimaModal: TemplateRef<any>;
  @ViewChild('valorIncorreto', {static: false}) valorIncorreto: TemplateRef<any>;
  @ViewChild('deduzirModal', {static: false}) deduzirModal: TemplateRef<any>;
  @ViewChild('deduzidoComSucessoModal', {static: false}) deduzidoComSucessoModal: TemplateRef<any>;
  esconderBotaoDeduzirEstoque: boolean = true;
  static indice: number = 0;
  formulaEscolhidaNome:string;



  constructor(private formBuilder: FormBuilder,
              private renderer: Renderer2,
              private activeRoute: ActivatedRoute,
              private modalService: BsModalService,
              // private tanqueService: TanqueService,//criar servico temporario
              private router: Router,
              private autoCalcularLightSemLactoseService: AutoCalcularLightSemLactoseService,
              private autoCalcularLightComLactoseService:AutoCalcularLightComLactoseService,
              private autoCalcular4e6SemLactose:AutoCalcular46SemLactoseService,
              private autoCalcular4e6ComLactose:AutoCalcular46ComLactoseService,
              private autoCalcular8SemLactose:AutoCalcular8SemLactoseService,
              private autoCalcular8ComLactose:AutoCalcular8ComLactoseService) {
  }

  ngOnDestroy(): void {
    this.inscricao.unsubscribe();
  }

  ngOnInit(): void {
    this.formularioEstatisticoPartida = this.formBuilder.group({
      totalDeSolidosDaPartida: [],
      totalDaPartida: [],
      gorduraDaPartida: [],
      snfDaPartida: [],
      acucarDaPartida: [],
      tcDaPartida: [72.81]
    });
    this.formularioValoresInputados = this.formBuilder.group({
      balanca: [],
      numeroDaPartida: [],
      data: [new Date()],
      linhas: this.formBuilder.array([this.iniciarLinhas()])
    });
    this.formularioTotalPartidaTotalEsperado = this.formBuilder.group({
      totalQuantidade: [],
      totalGordura: [],
      totalSnf: [],
      totalEsperadoGordura: [],
      totalEsperadoSnf: []

    });
    this.formularioVariaves = this.formBuilder.group({
      tf: [],
      tfObjetivo: [0],
      fatorAcucarMinimo: [],
      fatorAcucar:[],
      fatorAcucarMaximo: [],
      rfMinimo: [],
      rf:[],
      rfMaximo: [],
      acucar: [0],
      formulas: [],
      fatorAcucarAtual: [],
      rfAtual: []
    });
    let formula = new Formula();
    formula.gordura = '8.10';
    formula.rfMinimo = 0.401;
    formula.rfObjetivo=0.403
    formula.rfMaximo=0.403
    formula.faMinimo = 5.48;
    formula.faObjetivo=5.50
    formula.faMaximo=5.52
    formula.quantidadeDeAcucar = 7500;
    formula.tfObjetivo = 44.2;

    let formula2 = new Formula();
    formula2.gordura = '4';
    formula2.rfMinimo = 0.200;
    formula2.rfObjetivo=0.202
    formula2.rfMaximo=0.210
    formula2.faMinimo = 11.75;
    formula2.faObjetivo=11.77
    formula2.faMaximo=11.82
    formula2.quantidadeDeAcucar = 8200;
    formula2.tfObjetivo = 44.2;

    let formula3 = new Formula();
    formula3.gordura = '6';
    formula3.rfMinimo = 0.296;
    formula3.rfObjetivo=0.298
    formula3.rfMaximo = 0.300;
    formula3.faMinimo = 7.72;
    formula3.faObjetivo=7.73
    formula3.faMaximo = 7.76;
    formula3.quantidadeDeAcucar = 7900;
    formula3.tfObjetivo = 44.2;

    let formula4 = new Formula();
    formula4.gordura = 'light';
    formula4.rfMinimo = 0.010;
    formula4.rfObjetivo=0.010
    formula4.rfMaximo = 0.020;
    formula4.faMinimo = 0.10;
    formula4.faObjetivo=179
    formula4.faMaximo = 225.0;
    formula4.quantidadeDeAcucar = 7200;
    formula4.tfObjetivo = 32;

    this.listaDeFormulas.push(formula);
    this.listaDeFormulas.push(formula2);
    this.listaDeFormulas.push(formula3);
    this.listaDeFormulas.push(formula4);
    this.escolherFormulaDeLca();
    this.calcularSnfGorduraAtual();
    this.mudarValoresEsperadosQuandoMudarValorDeAcucar();
    this.calcularSolidosTotaisDaPartida();

  }


  get formArray(): FormArray {
    return this.formularioValoresInputados.get('linhas') as FormArray;
  }

  //contem todos os dados da linha da tabela
  iniciarLinhas(): FormGroup {
    return this.formBuilder.group({
      //controles do formulario
      analiseGordura: [],
      analiseSnf: [],
      materiaPrima:[],
      quantidade: [],
      kgGordura: [],
      kgSnf: [],

    });
  }

  //adiciona nova linha na tabela
  adicionarNovaLinha() {
    this.formArray.push(this.iniciarLinhas());
    SimuladorPartidasComponent.indice++;
    this.atualizarDadosFormulario(SimuladorPartidasComponent.indice);
  }


  //remove linha da tabela
  deletarLinhas(index: number) {
    this.formArray.removeAt(index);
    const el = this.quantidadeInput.nativeElement.focus();//retira da quantidade total pois elemento perde o foco
    SimuladorPartidasComponent.indice--;


  }

  //agrupa todos os metodos responsaveis por atualizar informaçoes na tabela
  atualizarDadosFormulario(i: number) {
    if (this.formArray.controls[i]) {
      this.calcularQuantidadeGorduraSnfReferenteAoTanque(i);//calcula a quantidade de gordura e snf baseado em uma quantidade de materia prima
    }

    this.mostrarQuantidadeTotal();//soma a quantidade de materia prima de todas as linhas
    this.mostrarQuantidadeGordura();//soma a quantidade de gordura de todas as linhas
    this.mostrarQuantidadeSnf();//soma a quantidade de snf de todas as linhas
    this.mostrarGorduraEsperada();
    this.mostrarTf();


  }

  mudarTotalEsperadoQuandoMudarAFormula() {
    this.mostrarQuantidadeTotal();//soma a quantidade de materia prima de todas as linhas
    this.mostrarQuantidadeGordura();//soma a quantidade de gordura de todas as linhas
    this.mostrarQuantidadeSnf();//soma a quantidade de snf de todas as linhas
    this.mostrarGorduraEsperada();
    this.mostrarTf();
  }

  calcularQuantidadeGorduraSnfReferenteAoTanque(i: number) {
    for (let x = 0; x < this.formArray.controls.length; x++) {
      let analiseGordura = this.formArray.controls[i].get('analiseGordura');
      let quantidade = this.formArray.controls[i].get('quantidade');
      let totalGordura = ((analiseGordura?.value * quantidade?.value) / 100).toFixed(2);
      let kgGordura = this.formArray.controls[i].get('kgGordura');
      let kgSnf = this.formArray.controls[i].get('kgSnf');
      let analiseSnf = this.formArray.controls[i].get('analiseSnf');
      let totalSnf = ((analiseSnf?.value * quantidade?.value) / 100).toFixed(2);
      kgSnf?.setValue(totalSnf);
      kgGordura?.setValue(totalGordura);

    }
  }

  mostrarQuantidadeTotal() {
    let resultado = 0;
    this.formArray.controls.forEach((formGroup: any) => {
      Object.keys(formGroup.controls).forEach(controleName => {
        if (controleName == 'quantidade') {
          let valor: string = formGroup.controls[controleName].value;
          if (valor !== null && valor !== '') {
            resultado += parseFloat(valor);
          }
        }
      });
    });
    this.formularioTotalPartidaTotalEsperado.get('totalQuantidade')?.setValue(resultado.toFixed(2));
  }

  mostrarQuantidadeGordura() {
    let resultado: number = 0;
    this.formArray.controls.forEach((formGroup: any) => {
      Object.keys(formGroup.controls).forEach(controleName => {
        if (controleName == 'kgGordura') {
          let valor: string = formGroup.controls[controleName].value;
          let valorConvertido = parseFloat(valor).toFixed(2);
          resultado += parseFloat(valorConvertido);
        }
      });
    });
    this.formularioTotalPartidaTotalEsperado.get('totalGordura')?.setValue(resultado.toFixed(2));
  }


  mostrarQuantidadeSnf() {
    let resultado = 0;
    this.formArray.controls.forEach((formGroup: any) => {
      Object.keys(formGroup.controls).forEach(controleName => {
        if (controleName == 'kgSnf') {
          let valor: string = formGroup.controls[controleName].value;
          resultado += parseFloat(valor);
        }
      });
    });
    this.formularioTotalPartidaTotalEsperado.get('totalSnf')?.setValue(resultado.toFixed(2));
  }


  mostrarGorduraEsperada() {
    let acucar = parseFloat(this.formularioVariaves.get('acucar')?.value);
    let fatorAcucar = parseFloat(this.formularioVariaves.get('fatorAcucar')?.value);
    this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.setValue((acucar / fatorAcucar).toFixed(2));
    this.mostrarSnfEsperado();
  }


  mostrarSnfEsperado() {
    let gorduraEsperada = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.value);
    let rf = parseFloat(this.formularioVariaves.get('rf')?.value);
    this.formularioTotalPartidaTotalEsperado.get('totalEsperadoSnf')?.setValue(parseFloat((gorduraEsperada / rf).toFixed(2)));
  }

  mostrarTf(): number {
    let totalGordura = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalGordura')?.value);

    let totalSnf = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalSnf')?.value);

    let acucar = parseFloat(this.formularioVariaves.get('acucar')?.value);

    let totalPartida = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalQuantidade')?.value);
    let variavel1 = (totalGordura + totalSnf + acucar);
    let variavel2 = (totalPartida + acucar);
    let tf: number = (variavel1 / variavel2) * 100;
    this.formularioVariaves.get('tf')?.setValue(tf.toFixed(2));
    return tf;
  }

  escolherFormulaDeLca() {
    this.formularioVariaves.get('formulas')?.valueChanges.subscribe((formula: Formula) => {
      let rfMinimo = this.formularioVariaves.get('rfMinimo');
      let rf=this.formularioVariaves.get('rf');
      let rfMaximo=  this.formularioVariaves.get('rfMaximo');
      let faMinimo = this.formularioVariaves.get('fatorAcucarMinimo');
      let fa=this.formularioVariaves.get('fatorAcucar')
      let faMaximo=this.formularioVariaves.get('fatorAcucarMaximo');
      let acucar = this.formularioVariaves.get('acucar');
      let tfObjetivo = this.formularioVariaves.get('tfObjetivo');
      rf?.setValue(formula.rfObjetivo)
      rfMinimo?.setValue(formula.rfMinimo);
      rfMaximo?.setValue(formula.rfMaximo);
      fa?.setValue(formula.faObjetivo)
      faMinimo?.setValue(formula.faMinimo);
      faMaximo?.setValue(formula.faMaximo)
      tfObjetivo?.setValue(formula.tfObjetivo);
      acucar?.setValue(formula.quantidadeDeAcucar);
      this.formulaEscolhidaNome=formula.gordura
      this.quantidadeInput.nativeElement.focus();
      this.mudarTotalEsperadoQuandoMudarAFormula();
    });
  }

  mudarValoresEsperadosQuandoMudarValorDeAcucar() {
    this.formularioVariaves.get('acucar')?.valueChanges.subscribe(valor => {
      this.mudarTotalEsperadoQuandoMudarAFormula();
    });
  }

  compararFormulas(obj1: any, obj2: any) {
    return obj1 && obj2 ? (obj1.gordura === obj2.gordura) : obj1 === obj2;
  }


  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {class: 'modal-dialog-centered'});
  }


  atualizarIndice(i: number) {
    SimuladorPartidasComponent.indice = i;
  }


  mostraMensagemDeInserirFormula() {
    if (isNaN(this.formularioVariaves.get('tf')?.value)) {//pedir para selecionar formula
      this.openModal(this.template);

    }
  }


  calcularSnfGorduraAtual() {
    this.formularioVariaves.get('formulas')?.valueChanges.subscribe((formula: Formula) => {
      this.formularioTotalPartidaTotalEsperado.get('totalGordura')?.valueChanges.subscribe(gorduraTotal => {
        let fatorAcucar = (this.formularioVariaves.get('acucar')?.value / gorduraTotal).toFixed(2);
        this.formularioVariaves.get('fatorAcucarAtual')?.setValue(fatorAcucar);
        this.formularioTotalPartidaTotalEsperado.get('totalSnf')?.valueChanges.subscribe(snfTotal => {
          let rf = (gorduraTotal / snfTotal).toFixed(3);
          this.formularioVariaves.get('rfAtual')?.setValue(rf);
          if (this.formularioVariaves.get('fatorAcucarAtual')?.value == this.formularioVariaves.get('fatorAcucar')?.value &&
            this.formularioVariaves.get('rfAtual')?.value == this.formularioVariaves.get('rf')?.value) {
            this.esconderBotaoDeduzirEstoque = false;
            console.log('iguais');

          } else {
            this.esconderBotaoDeduzirEstoque = true;
          }
        });
      });
    });


  }

  calcularSolidosTotaisDaPartida() {
    this.formularioTotalPartidaTotalEsperado.get('totalGordura')?.valueChanges.subscribe((gordura) => {
      this.formularioTotalPartidaTotalEsperado.get('totalSnf')?.valueChanges.subscribe((snf) => {
        let acucar = this.formularioVariaves.get('acucar')?.value;
        if (!isNaN(gordura) && !isNaN(snf)) {
          let acucarRes = parseFloat(acucar);
          let snfRes = parseFloat(snf);
          let gorduraRes = parseFloat(gordura);
          let result = acucarRes + gorduraRes + snfRes;
          this.formularioEstatisticoPartida.get('totalDeSolidosDaPartida')?.setValue(result.toFixed(2));
          this.calcularTotalDaPartidaAposEvaporacao(result);
        }

      });
    });
  }

  private calcularTotalDaPartidaAposEvaporacao(totalDeSolidos: number) {
    let tcAtual = this.formularioEstatisticoPartida.get('tcDaPartida')?.value;
    let result = (totalDeSolidos * 100) / tcAtual;
    this.calcularPorcentagemDeGorduraAposEvaporacao(result);
    this.calcularPorcentagemDeSnfApoEvaporacao(result);
    this.calcularPorcentagemDeAcucarAposEvaporacao(result);
    this.formularioEstatisticoPartida.get('totalDaPartida')?.setValue(result.toFixed(2));
    this.formularioEstatisticoPartida.get('tcDaPartida')?.valueChanges.subscribe(tc => {
      tcAtual = tc;
      result = (totalDeSolidos * 100) / tcAtual;
      this.formularioEstatisticoPartida.get('totalDaPartida')?.setValue(result.toFixed(2));
      this.calcularPorcentagemDeGorduraAposEvaporacao(result * 100);
      this.calcularPorcentagemDeSnfApoEvaporacao(result * 100);
      this.calcularPorcentagemDeAcucarAposEvaporacao(result * 100);
    });
  }

  private calcularPorcentagemDeGorduraAposEvaporacao(totalDeSolidosAposEvaporaçao: number) {
    let totalDeGordura: number = this.formularioTotalPartidaTotalEsperado.get('totalGordura')?.value;
    let porcentageGordura = (totalDeGordura * 100) / totalDeSolidosAposEvaporaçao;
    this.formularioEstatisticoPartida.get('gorduraDaPartida')?.setValue(porcentageGordura.toFixed(2));
  }

  private calcularPorcentagemDeSnfApoEvaporacao(totalDeSolidosAposEvaporaçao: number) {
    let totalSnf = this.formularioTotalPartidaTotalEsperado.get('totalSnf')?.value;
    let porcentagemSnf = (totalSnf * 100) / totalDeSolidosAposEvaporaçao;
    this.formularioEstatisticoPartida.get('snfDaPartida')?.setValue(porcentagemSnf.toFixed(2));
  }

  private calcularPorcentagemDeAcucarAposEvaporacao(totalDeSolidosAposEvaporaçacao: number) {
    let acucar = this.formularioVariaves.get('acucar')?.value;
    let result = (acucar * 100) / totalDeSolidosAposEvaporaçacao;
    this.formularioEstatisticoPartida.get('acucarDaPartida')?.setValue(result.toFixed(2));
  }

  autoCalcularLightSemLactose() {
    let agua = this.formArray.controls[0];
    let analiseGorduraAgua = parseFloat(agua.get('analiseGordura')?.value);
    let analiseSnfAgua = parseFloat(agua.get('analiseSnf')?.value);

    let preCondensadoDesnatado = this.formArray.controls[1];
    let analiseGorduraPreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseGordura')?.value);
    let analiseSnfLeitePreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseSnf')?.value);

    let butterOil = this.formArray.controls[2];
    let analiseGorduraButterOil = parseFloat(butterOil.get('analiseGordura')?.value);
    let analiseSnfButterOil = parseFloat(butterOil.get('analiseSnf')?.value);


    let acucar = parseInt(this.formularioVariaves.get('acucar')?.value);
    let tfObjetivo = parseFloat(this.formularioVariaves.get('tfObjetivo')?.value);
    let totalEsperadoGordura = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.value);
    let totalEsperadoSnf = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoSnf')?.value);
    let faMinimo=parseFloat(this.formularioVariaves.get('fatorAcucarMinimo')?.value)
    let faMaximo=parseFloat(this.formularioVariaves.get('fatorAcucarMaximo')?.value)
    let rfMinimo=parseFloat(this.formularioVariaves.get('rfMinimo')?.value)
    let rfMaximo=parseFloat(this.formularioVariaves.get('rfMaximo')?.value)
    let result = this.autoCalcularLightSemLactoseService.autoCalcularLightSemLactose(
      acucar,
      totalEsperadoGordura,
      totalEsperadoSnf,
      tfObjetivo,
      faMinimo,
      faMaximo,
      rfMinimo,
      rfMaximo,
      analiseGorduraPreDesnatado,
      analiseSnfLeitePreDesnatado,
      analiseGorduraAgua,
      analiseSnfAgua,
      analiseGorduraButterOil,
      analiseSnfButterOil
    );
    agua.patchValue({quantidade: result.quantidadeAgua});
    this.atualizarDadosFormulario(0);
    preCondensadoDesnatado.patchValue({quantidade: result.quantidadePreDesnatado});
    this.atualizarDadosFormulario(1);
    butterOil.patchValue({quantidade: result.quantidadeButterOil});
    this.atualizarDadosFormulario(2);
  }

  autoCalcularLightComLactose() {
    let agua = this.formArray.controls[0];
    let analiseGorduraAgua = parseFloat(agua.get('analiseGordura')?.value);
    let analiseSnfAgua = parseFloat(agua.get('analiseSnf')?.value);

    let preCondensadoDesnatado = this.formArray.controls[1];
    let analiseGorduraPreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseGordura')?.value);
    let analiseSnfLeitePreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseSnf')?.value);

    let butterOil = this.formArray.controls[2];
    let analiseGorduraButterOil = parseFloat(butterOil.get('analiseGordura')?.value);
    let analiseSnfButterOil = parseFloat(butterOil.get('analiseSnf')?.value);

    let lactose = this.formArray.controls[3];
    let analiseGorduraLactose = parseFloat(lactose.get('analiseGordura')?.value);
    let analiseSnfLactose = parseFloat(lactose.get('analiseSnf')?.value);


    let acucar = parseInt(this.formularioVariaves.get('acucar')?.value);
    let tfObjetivo = parseFloat(this.formularioVariaves.get('tfObjetivo')?.value);
    let totalEsperadoGordura = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.value);
    let totalEsperadoSnf = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoSnf')?.value);
    let faMinimo=parseFloat(this.formularioVariaves.get('fatorAcucarMinimo')?.value)
    let faMaximo=parseFloat(this.formularioVariaves.get('fatorAcucarMaximo')?.value)
    let rfMinimo=parseFloat(this.formularioVariaves.get('rfMinimo')?.value)
    let rfMaximo=parseFloat(this.formularioVariaves.get('rfMaximo')?.value)
    let result = this.autoCalcularLightComLactoseService.autoCalcularLightComLactose(
      acucar,
      totalEsperadoGordura,
      totalEsperadoSnf,
      tfObjetivo,
      faMinimo,
      faMaximo,
      rfMinimo,
      rfMaximo,
      analiseGorduraPreDesnatado,
      analiseSnfLeitePreDesnatado,
      analiseGorduraAgua,
      analiseSnfAgua,
      analiseGorduraButterOil,
      analiseSnfButterOil,
      analiseGorduraLactose,
      analiseSnfLactose
    );
    agua.patchValue({quantidade: result.quantidadeAgua});
    this.atualizarDadosFormulario(0);
    preCondensadoDesnatado.patchValue({quantidade: result.quantidadePreDesnatado});
    this.atualizarDadosFormulario(1);
    butterOil.patchValue({quantidade: result.quantidadeButterOil});
    this.atualizarDadosFormulario(2);
    lactose.patchValue({quantidade: result.quantidadeLactose});
    this.atualizarDadosFormulario(3);
  }


  autoCalcular4E6SemLactose() {
    let leiteIntegral = this.formArray.controls[0];
    let analiseGorduraLeiteIntegral = parseFloat(leiteIntegral.get('analiseGordura')?.value);
    let analiseSnfLeiteIntegral = parseFloat(leiteIntegral.get('analiseSnf')?.value);

    let preCondensadoDesnatado = this.formArray.controls[1];
    let analiseGorduraPreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseGordura')?.value);
    let analiseSnfLeitePreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseSnf')?.value);

    let preCondensadoIntegral = this.formArray.controls[2];
    let analiseGorduraPreIntegral = parseFloat(preCondensadoIntegral.get('analiseGordura')?.value);
    let analiseSnfLeitePreIntegral = parseFloat(preCondensadoIntegral.get('analiseSnf')?.value);


    let acucar = parseInt(this.formularioVariaves.get('acucar')?.value);
    let tfObjetivo = parseFloat(this.formularioVariaves.get('tfObjetivo')?.value);
    let totalEsperadoGordura = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.value);
    let totalEsperadoSnf = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoSnf')?.value);
    let faMinimo=parseFloat(this.formularioVariaves.get('fatorAcucarMinimo')?.value)
    let faMaximo=parseFloat(this.formularioVariaves.get('fatorAcucarMaximo')?.value)
    let rfMinimo=parseFloat(this.formularioVariaves.get('rfMinimo')?.value)
    let rfMaximo=parseFloat(this.formularioVariaves.get('rfMaximo')?.value)
   let result= this.autoCalcular4e6SemLactose.autoCalcularSemLactose(
      acucar,
      totalEsperadoGordura,
      totalEsperadoSnf,
      tfObjetivo,
      faMinimo,
      faMaximo,
      rfMinimo,
      rfMaximo,
      analiseGorduraPreDesnatado,
      analiseSnfLeitePreDesnatado,
      analiseGorduraLeiteIntegral,
      analiseSnfLeiteIntegral,
      analiseGorduraPreIntegral,
      analiseSnfLeitePreIntegral
      );
    leiteIntegral.patchValue({quantidade: result.quantidadeLeite});
    this.atualizarDadosFormulario(0);
    preCondensadoDesnatado.patchValue({quantidade: result.quantidadePreDesnatado});
    this.atualizarDadosFormulario(1);
    preCondensadoIntegral.patchValue({quantidade:result.quantidadePreIntegral})
    this.atualizarDadosFormulario(2);


  }

  autoCalcularSemLactose8() {
    let leiteIntegral = this.formArray.controls[0];
    let analiseGorduraLeiteIntegral = parseFloat(leiteIntegral.get('analiseGordura')?.value);
    let analiseSnfLeiteIntegral = parseFloat(leiteIntegral.get('analiseSnf')?.value);

    let preCondensadoDesnatado = this.formArray.controls[1];
    let analiseGorduraPreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseGordura')?.value);
    let analiseSnfLeitePreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseSnf')?.value);

    let preCondensadoIntegral = this.formArray.controls[2];
    let analiseGorduraPreIntegral = parseFloat(preCondensadoIntegral.get('analiseGordura')?.value);
    let analiseSnfLeitePreIntegral = parseFloat(preCondensadoIntegral.get('analiseSnf')?.value);

    let butterOil = this.formArray.controls[3];
    let analiseGorduraButterOil = parseFloat(butterOil.get('analiseGordura')?.value);
    let analiseSnfButterOil = parseFloat(butterOil.get('analiseSnf')?.value);

    let acucar = parseInt(this.formularioVariaves.get('acucar')?.value);
    let tfObjetivo = parseFloat(this.formularioVariaves.get('tfObjetivo')?.value);
    let totalEsperadoGordura = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.value);
    let totalEsperadoSnf = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoSnf')?.value);
    let faMinimo=parseFloat(this.formularioVariaves.get('fatorAcucarMinimo')?.value)
    let faMaximo=parseFloat(this.formularioVariaves.get('fatorAcucarMaximo')?.value)
    let rfMinimo=parseFloat(this.formularioVariaves.get('rfMinimo')?.value)
    let rfMaximo=parseFloat(this.formularioVariaves.get('rfMaximo')?.value)
    let result=this.autoCalcular8SemLactose.autoCalcularSemLactose(
      acucar,
      totalEsperadoGordura,
      totalEsperadoSnf,
      rfMinimo,
      rfMaximo,
      faMinimo,
      faMaximo,
      tfObjetivo,
      analiseGorduraLeiteIntegral,
      analiseSnfLeiteIntegral,
      analiseGorduraPreIntegral,
      analiseSnfLeitePreIntegral,
      analiseGorduraPreDesnatado,
      analiseSnfLeitePreDesnatado,
      analiseGorduraButterOil,
      analiseSnfButterOil
    )
    leiteIntegral.patchValue({quantidade: result.leite});
    this.atualizarDadosFormulario(0);
    preCondensadoDesnatado.patchValue({quantidade: result.preDesnatado});
    this.atualizarDadosFormulario(1);
    preCondensadoIntegral.patchValue({quantidade:result.preIntegral})
    this.atualizarDadosFormulario(2);
    butterOil.patchValue({quantidade:result.butterOil})
    this.atualizarDadosFormulario(3)
  }

  autoCalcular4E6ComLactose() {
    let leiteIntegral = this.formArray.controls[0];
    let analiseGorduraLeiteIntegral = parseFloat(leiteIntegral.get('analiseGordura')?.value);
    let analiseSnfLeiteIntegral = parseFloat(leiteIntegral.get('analiseSnf')?.value);

    let preCondensadoDesnatado = this.formArray.controls[1];
    let analiseGorduraPreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseGordura')?.value);
    let analiseSnfLeitePreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseSnf')?.value);

    let preCondensadoIntegral = this.formArray.controls[2];
    let analiseGorduraPreIntegral = parseFloat(preCondensadoIntegral.get('analiseGordura')?.value);
    let analiseSnfLeitePreIntegral = parseFloat(preCondensadoIntegral.get('analiseSnf')?.value);

    let lactose = this.formArray.controls[3];
    let analiseGorduraLactose = parseFloat(lactose.get('analiseGordura')?.value);
    let analiseSnfLactose = parseFloat(lactose.get('analiseSnf')?.value);

    let acucar = parseInt(this.formularioVariaves.get('acucar')?.value);
    let tfObjetivo = parseFloat(this.formularioVariaves.get('tfObjetivo')?.value);
    let totalEsperadoGordura = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.value);
    let totalEsperadoSnf = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoSnf')?.value);
    let faMinimo=parseFloat(this.formularioVariaves.get('fatorAcucarMinimo')?.value)
    let faMaximo=parseFloat(this.formularioVariaves.get('fatorAcucarMaximo')?.value)
    let rfMinimo=parseFloat(this.formularioVariaves.get('rfMinimo')?.value)
    let rfMaximo=parseFloat(this.formularioVariaves.get('rfMaximo')?.value)
    let result=this.autoCalcular4e6ComLactose.autoCalcular4e6ComLactose(
      acucar,
      totalEsperadoGordura,
      totalEsperadoSnf,
      tfObjetivo,
      faMinimo,
      faMaximo,
      rfMinimo,
      rfMaximo,
      analiseGorduraPreDesnatado,
      analiseSnfLeitePreDesnatado,
      analiseGorduraLeiteIntegral,
      analiseSnfLeiteIntegral,
      analiseGorduraPreIntegral,
      analiseSnfLeitePreIntegral,
      analiseSnfLactose,
      analiseGorduraLactose)

    leiteIntegral.patchValue({quantidade: result.quantidadeLeite});
    this.atualizarDadosFormulario(0);

    preCondensadoDesnatado.patchValue({quantidade: result.quantidadePreDesnatado});
    this.atualizarDadosFormulario(1);

    preCondensadoIntegral.patchValue({quantidade:result.quantidadePreIntegral})
    this.atualizarDadosFormulario(2);

    lactose.patchValue({quantidade:result.quantidadeLactose})
    this.atualizarDadosFormulario(3)

  }

  autoCalcularComLactose8() {
    let leiteIntegral = this.formArray.controls[0];
    let analiseGorduraLeiteIntegral = parseFloat(leiteIntegral.get('analiseGordura')?.value);
    let analiseSnfLeiteIntegral = parseFloat(leiteIntegral.get('analiseSnf')?.value);

    let preCondensadoDesnatado = this.formArray.controls[1];
    let analiseGorduraPreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseGordura')?.value);
    let analiseSnfLeitePreDesnatado = parseFloat(preCondensadoDesnatado.get('analiseSnf')?.value);

    let preCondensadoIntegral = this.formArray.controls[2];
    let analiseGorduraPreIntegral = parseFloat(preCondensadoIntegral.get('analiseGordura')?.value);
    let analiseSnfLeitePreIntegral = parseFloat(preCondensadoIntegral.get('analiseSnf')?.value);

    let butterOil = this.formArray.controls[3];
    let analiseGorduraButterOil = parseFloat(butterOil.get('analiseGordura')?.value);
    let analiseSnfButterOil = parseFloat(butterOil.get('analiseSnf')?.value);

    let lactose = this.formArray.controls[4];
    let analiseGorduraLactose = parseFloat(lactose.get('analiseGordura')?.value);
    let analiseSnfLactose = parseFloat(lactose.get('analiseSnf')?.value);

    let acucar = parseInt(this.formularioVariaves.get('acucar')?.value);
    let tfObjetivo = parseFloat(this.formularioVariaves.get('tfObjetivo')?.value);
    let totalEsperadoGordura = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoGordura')?.value);
    let totalEsperadoSnf = parseFloat(this.formularioTotalPartidaTotalEsperado.get('totalEsperadoSnf')?.value);
    let faMinimo=parseFloat(this.formularioVariaves.get('fatorAcucarMinimo')?.value)
    let faMaximo=parseFloat(this.formularioVariaves.get('fatorAcucarMaximo')?.value)
    let rfMinimo=parseFloat(this.formularioVariaves.get('rfMinimo')?.value)
    let rfMaximo=parseFloat(this.formularioVariaves.get('rfMaximo')?.value)
    let result=this.autoCalcular8ComLactose.autoCalcular8ComLactose(
      acucar,
      totalEsperadoGordura,
      totalEsperadoSnf,
      rfMinimo,
      rfMaximo,
      faMinimo,
      faMaximo,
      tfObjetivo,
      analiseGorduraLeiteIntegral,
      analiseSnfLeiteIntegral,
      analiseGorduraPreIntegral,
      analiseSnfLeitePreIntegral,
      analiseGorduraPreDesnatado,
      analiseSnfLeitePreDesnatado,
      analiseGorduraButterOil,
      analiseSnfButterOil,
      analiseSnfLactose,
      analiseGorduraLactose
    )
    leiteIntegral.patchValue({quantidade: result.leite});
    this.atualizarDadosFormulario(0);
    preCondensadoDesnatado.patchValue({quantidade: result.preDesnatado});
    this.atualizarDadosFormulario(1);
    preCondensadoIntegral.patchValue({quantidade:result.preIntegral})
    this.atualizarDadosFormulario(2);
    butterOil.patchValue({quantidade:result.butterOil})
    this.atualizarDadosFormulario(3)
    lactose.patchValue({quantidade:result.lactose})
    this.atualizarDadosFormulario(4)
    console.log(result)
  }

  public verificarSequenciaMateriasPrimasAutoCalcular8SemLactose():string{
    if(this.formArray.controls.length==4){
      let leiteIntegral = this.formArray.controls[0];
      let preCondensadoDesnatado = this.formArray.controls[1];
      let preCondensadoIntegral = this.formArray.controls[2];
      let butterOil = this.formArray.controls[3];
      if(leiteIntegral.get('materiaPrima')?.value=='leite integral'&&
        preCondensadoDesnatado.get('materiaPrima')?.value=='pre desnatado'&&
        preCondensadoIntegral.get('materiaPrima')?.value=='pre integral'&&
        (butterOil.get('materiaPrima')?.value=='butter oil'||butterOil.get('materiaPrima')?.value=='creme')){
        return 'autoCalcular8SemLactose'
      }
    }
    return ''
  }

  public verificarSequenciaMateriasPrimasAutoCalcular8ComLactose():string{
    if(this.formArray.controls.length==5){
      let leiteIntegral = this.formArray.controls[0];
      let preCondensadoDesnatado = this.formArray.controls[1];
      let preCondensadoIntegral = this.formArray.controls[2];
      let butterOil = this.formArray.controls[3];
      let lactose = this.formArray.controls[4];
      if(leiteIntegral.get('materiaPrima')?.value=='leite integral'&&
        preCondensadoDesnatado.get('materiaPrima')?.value=='pre desnatado'&&
        preCondensadoIntegral.get('materiaPrima')?.value=='pre integral'&&
        (butterOil.get('materiaPrima')?.value=='butter oil'||butterOil.get('materiaPrima')?.value=='creme')&&
        lactose.get('materiaPrima')?.value=='lactose'){
        return 'autoCalcular8ComLactose'
      }
    }

    return ''
  }

  public verificarSequenciaMateriasPrimasAutoCalcularLightSemLactose():string{
    if(this.formArray.controls.length==3){
      let agua = this.formArray.controls[0];
      let preCondensadoDesnatado = this.formArray.controls[1];
      let butterOil = this.formArray.controls[2];
      if(agua.get('materiaPrima')?.value=='agua'&&
        preCondensadoDesnatado.get('materiaPrima')?.value=='pre desnatado'&&
        (butterOil.get('materiaPrima')?.value=='butter oil'||butterOil.get('materiaPrima')?.value=='creme'||butterOil.get('materiaPrima')?.value=='pre integral')){
        return 'autoCalcularLightSemLactose'
      }
    }
    return ''
  }

  public verificarSequenciaMateriasPrimasAutoCalcularLightComLactose():string{
    if(this.formArray.controls.length==4){
      let agua = this.formArray.controls[0];
      let preCondensadoDesnatado = this.formArray.controls[1];
      let butterOil = this.formArray.controls[2];
      let lactose=this.formArray.controls[3];
      if(agua.get('materiaPrima')?.value=='agua'&&
        preCondensadoDesnatado.get('materiaPrima')?.value=='pre desnatado'&&
        (butterOil.get('materiaPrima')?.value=='butter oil'||butterOil.get('materiaPrima')?.value=='creme'||butterOil.get('materiaPrima')?.value=='pre integral')&&
        lactose.get('materiaPrima')?.value=='lactose'){
        return 'autoCalcularLightComLactose'
      }
    }
    return ''
  }

  public verificarSequenciaMateriasPrimasAutoCalcular4E6SemLactose():string{
    if(this.formArray.controls.length==3){
      let leite = this.formArray.controls[0];
      let preCondensadoDesnatado = this.formArray.controls[1];
      let preIntegral = this.formArray.controls[2];
      if(leite.get('materiaPrima')?.value=='leite integral'&&
        preCondensadoDesnatado.get('materiaPrima')?.value=='pre desnatado'&&
        preIntegral.get('materiaPrima')?.value=='pre integral'){
        return 'autoCalcular4ESemLactose'
      }
    }
    return ''
  }

  public verificarSequenciaMateriasPrimasAutoCalcular4E6ComLactose():string{
    if(this.formArray.controls.length==4){
      let leite = this.formArray.controls[0];
      let preCondensadoDesnatado = this.formArray.controls[1];
      let preIntegral = this.formArray.controls[2];
      let lactose=this.formArray.controls[3]
      if(leite.get('materiaPrima')?.value=='leite integral'&&
        preCondensadoDesnatado.get('materiaPrima')?.value=='pre desnatado'&&
        preIntegral.get('materiaPrima')?.value=='pre integral'&&
        lactose.get('materiaPrima')?.value=='lactose'){
        return 'autoCalcular4E6ComLactose'
      }
    }
    return ''
  }

  public exibirBotaoDeduzirDoEstoque():boolean{
     let fa=parseFloat(this.formularioVariaves.get('fatorAcucarAtual')?.value)
     let faMin=parseFloat(this.formularioVariaves.get('fatorAcucarMinimo')?.value)
     let faMax=parseFloat(this.formularioVariaves.get('fatorAcucarMaximo')?.value)

     let rf=parseFloat(this.formularioVariaves.get('rfAtual')?.value)
     let rfMin=parseFloat(this.formularioVariaves.get('rfMinimo')?.value)
     let rfMax=parseFloat(this.formularioVariaves.get('rfMaximo')?.value)

     let tfAtual=parseFloat(this.formularioVariaves.get('tf')?.value)
     let tfObjetivo=parseFloat(this.formularioVariaves.get('tfObjetivo')?.value)

    if(tfAtual==tfObjetivo&&(fa>=faMin&&fa<=faMax)&&(rf>=rfMin&&rf<=rfMax)){
      return true
    }
    return false
  }

}
